import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Token from '../models/Token.js';
import { sendConfirmationEmail, sendPasswordResetEmail, sendInvitationEmail  } from '../services/emailService.js';

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;
    
    // Only allow trader and vendor self-signup
    if (!['trader', 'vendor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for public signup' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, role, firstName, lastName });
    
    // Create confirmation token
    const tokenStr = crypto.randomBytes(32).toString('hex');
    await Token.create({ userId: user._id, token: tokenStr, type: 'email-confirmation' });
    
    // Send email
    const domain = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 5000}`;
    await sendConfirmationEmail(user.email, tokenStr, domain);
    
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    next(error);
  }
};

const renderVerificationPage = (success, message) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
        .icon { font-size: 48px; margin-bottom: 20px; }
        .success .icon { color: #28a745; }
        .error .icon { color: #dc3545; }
        h1 { margin: 0 0 10px; font-size: 24px; color: #333; }
        p { color: #666; margin-bottom: 30px; line-height: 1.5; }
        .btn { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.3s; }
        .btn:hover { background: #0056b3; }
        .timer { font-size: 14px; color: #999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="card ${success ? 'success' : 'error'}">
        <div class="icon">${success ? '✓' : '✗'}</div>
        <h1>${success ? 'Verification Successful' : 'Verification Failed'}</h1>
        <p>${message}</p>
        <button class="btn" onclick="window.close()">Close Window</button>
        <div class="timer">Closing automatically in <span id="countdown">10</span> seconds...</div>
    </div>
    <script>
        let timeLeft = 10;
        const countdownEl = document.getElementById('countdown');
        const timer = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                window.close();
            }
        }, 1000);
    </script>
</body>
</html>
`;

export const confirmEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const tokenDoc = await Token.findOne({ token, type: 'email-confirmation' });
    
    if (!tokenDoc) {
      return res.status(400).send(renderVerificationPage(false, 'The verification link is invalid or has expired.'));
    }
    
    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(400).send(renderVerificationPage(false, 'The user associated with this verification link could not be found.'));
    }
    
    user.isEmailConfirmed = true;
    await user.save();
    
    await tokenDoc.deleteOne();
    
    res.status(200).send(renderVerificationPage(true, 'Your email has been successfully confirmed. You can now login to your account.'));
  } catch (error) {
    res.status(500).send(renderVerificationPage(false, 'An internal server error occurred during verification.'));
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isEmailConfirmed) {
      return res.status(401).json({ message: 'Please confirm your email first' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Single device login logic: invalidate any old refresh token
    user.activeRefreshToken = refreshToken;
    await user.save();
    
    res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const user = req.user;
    user.activeRefreshToken = null;
    await user.save();
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    
    const user = await User.findOne({ activeRefreshToken: refreshToken });
    
    if (!user) {
       // Possible token reuse attack or simply logged out/invalidated
       return res.status(403).json({ message: 'Refresh token is invalid or expired' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    user.activeRefreshToken = tokens.refreshToken;
    await user.save();
    
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tokenStr = crypto.randomBytes(32).toString('hex');
    await Token.create({ userId: user._id, token: tokenStr, type: 'password-reset' });

    const domain = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 5000}`;
    await sendPasswordResetEmail(user.email, tokenStr, domain);

    res.status(200).json({ message: 'Password reset link sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const tokenDoc = await Token.findOne({ token, type: 'password-reset' });
    
    if (!tokenDoc) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    const user = await User.findById(tokenDoc.userId);
    user.password = newPassword;
    user.activeRefreshToken = null; // Log out everywhere
    await user.save();
    
    await tokenDoc.deleteOne();
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// Vendor invites a team-member
export const inviteTeamMember = async (req, res, next) => {
  try {
    const { email, designation } = req.body;
    const vendorId = req.user._id;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const tokenStr = crypto.randomBytes(32).toString('hex');
    
    // We can pre-create a shell user
    const user = await User.create({
      email,
      password: crypto.randomBytes(16).toString('hex'), // random password
      role: 'team-member',
      vendorId,
      designation
    });

    await Token.create({ userId: user._id, token: tokenStr, type: 'invitation' });

    const domain = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 5000}`;
    await sendInvitationEmail(user.email, tokenStr, domain, designation);

    res.status(200).json({ message: 'Invitation sent' });
  } catch (error) {
    next(error);
  }
};

// Team member accepts invitation and sets password
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token, firstName, lastName, password } = req.body;
    const tokenDoc = await Token.findOne({ token, type: 'invitation' });
    
    if (!tokenDoc) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    const user = await User.findById(tokenDoc.userId);
    user.firstName = firstName;
    user.lastName = lastName;
    user.password = password;
    user.isEmailConfirmed = true; // Implicitly confirmed
    await user.save();
    
    await tokenDoc.deleteOne();
    
    res.status(200).json({ message: 'Account registered successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};
