import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Token from "../models/Token.js";

import {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
} from "../services/emailService.js";

// ============================================================
// TOKEN GENERATION
// ============================================================

const generateTokens = (id) => {
  const accessToken = jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto
    .randomBytes(40)
    .toString("hex");

  return {
    accessToken,
    refreshToken,
  };
};

// ============================================================
// REGISTER
// Trader / Vendor public registration
// ============================================================

export const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
    } = req.body;

    // Only Trader and Vendor can register themselves.
    // Team Members are created through Vendor invitation.
    if (!["trader", "vendor"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role for public signup",
      });
    }

    const userExists = await User.findOne({
      email,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // --------------------------------------------------------
    // Email verification configuration
    //
    // Set SKIP_EMAIL_VERIFICATION=true for deployment/demo
    // when no email provider/domain is configured.
    // --------------------------------------------------------

    const skipEmailVerification =
      process.env.SKIP_EMAIL_VERIFICATION === "true";

    const user = await User.create({
      email,
      password,
      role,
      firstName,
      lastName,
      isEmailConfirmed: skipEmailVerification,
    });

    // --------------------------------------------------------
    // Email verification
    //
    // When enabled:
    // 1. Create verification token
    // 2. Send confirmation email
    //
    // When skipped:
    // Account is already confirmed and no email is sent.
    // --------------------------------------------------------

    if (!skipEmailVerification) {
      const tokenStr = crypto
        .randomBytes(32)
        .toString("hex");

      await Token.create({
        userId: user._id,
        token: tokenStr,
        type: "email-confirmation",
      });

      await sendConfirmationEmail(
        user.email,
        tokenStr
      );
    }

    res.status(201).json({
      message: skipEmailVerification
        ? "Registration successful. You can now login."
        : "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EMAIL VERIFICATION PAGE
// ============================================================

const renderVerificationPage = (
  success,
  message
) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Email Verification</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family:
        'Segoe UI',
        Tahoma,
        Geneva,
        Verdana,
        sans-serif;

      background:
        #0f172a;

      display: flex;

      justify-content: center;

      align-items: center;

      min-height: 100vh;

      margin: 0;

      padding: 20px;
    }

    .card {
      background: #ffffff;

      padding: 40px;

      border-radius: 16px;

      box-shadow:
        0 20px 50px rgba(0, 0, 0, 0.25);

      text-align: center;

      max-width: 440px;

      width: 100%;
    }

    .icon {
      width: 70px;

      height: 70px;

      border-radius: 50%;

      display: flex;

      align-items: center;

      justify-content: center;

      margin: 0 auto 20px;

      font-size: 36px;

      font-weight: bold;
    }

    .success .icon {
      background: #dcfce7;

      color: #16a34a;
    }

    .error .icon {
      background: #fee2e2;

      color: #dc2626;
    }

    h1 {
      margin: 0 0 12px;

      font-size: 24px;

      color: #1e293b;
    }

    p {
      color: #64748b;

      margin-bottom: 24px;

      line-height: 1.6;
    }

    .btn {
      background: #4f46e5;

      color: white;

      border: none;

      padding: 12px 24px;

      border-radius: 8px;

      font-size: 15px;

      cursor: pointer;

      text-decoration: none;

      display: inline-block;

      transition:
        background 0.2s ease;
    }

    .btn:hover {
      background: #4338ca;
    }

    .timer {
      font-size: 13px;

      color: #94a3b8;

      margin-top: 18px;
    }
  </style>
</head>

<body>

  <div class="card ${success ? "success" : "error"}">

    <div class="icon">
      ${success ? "✓" : "✗"}
    </div>

    <h1>
      ${
        success
          ? "Verification Successful"
          : "Verification Failed"
      }
    </h1>

    <p>
      ${message}
    </p>

    <button
      class="btn"
      onclick="window.close()"
    >
      Close Window
    </button>

    <div class="timer">
      Closing automatically in
      <span id="countdown">10</span>
      seconds...
    </div>

  </div>

  <script>
    let timeLeft = 10;

    const countdownEl =
      document.getElementById("countdown");

    const timer = setInterval(() => {

      timeLeft--;

      countdownEl.textContent =
        timeLeft;

      if (timeLeft <= 0) {

        clearInterval(timer);

        window.close();
      }

    }, 1000);
  </script>

</body>

</html>
`;

// ============================================================
// CONFIRM EMAIL
// GET /api/auth/confirm-email?token=...
// ============================================================

export const confirmEmail = async (
  req,
  res,
  next
) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .send(
          renderVerificationPage(
            false,
            "No verification token was provided."
          )
        );
    }

    const tokenDoc = await Token.findOne({
      token,
      type: "email-confirmation",
    });

    if (!tokenDoc) {
      return res
        .status(400)
        .send(
          renderVerificationPage(
            false,
            "The verification link is invalid or has expired."
          )
        );
    }

    const user = await User.findById(
      tokenDoc.userId
    );

    if (!user) {
      return res
        .status(400)
        .send(
          renderVerificationPage(
            false,
            "The user associated with this verification link could not be found."
          )
        );
    }

    user.isEmailConfirmed = true;

    await user.save();

    // Token is single-use.
    await tokenDoc.deleteOne();

    return res
      .status(200)
      .send(
        renderVerificationPage(
          true,
          "Your email has been successfully confirmed. You can now login to your account."
        )
      );
  } catch (error) {
    console.error(
      "Email confirmation error:",
      error
    );

    return res
      .status(500)
      .send(
        renderVerificationPage(
          false,
          "An internal server error occurred during verification."
        )
      );
  }
};

// ============================================================
// LOGIN
// ============================================================

export const login = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isEmailConfirmed) {
      return res.status(401).json({
        message:
          "Please confirm your email first",
      });
    }

    const isMatch =
      await user.comparePassword(
        password
      );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const {
      accessToken,
      refreshToken,
    } = generateTokens(user._id);

    // Single-device login.
    // Any previous refresh token becomes invalid.
    user.activeRefreshToken =
      refreshToken;

    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,

      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        designation: user.designation,
        vendorId: user.vendorId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LOGOUT
// ============================================================

export const logout = async (
  req,
  res,
  next
) => {
  try {
    const user = req.user;

    user.activeRefreshToken = null;

    await user.save();

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

export const refreshToken = async (
  req,
  res,
  next
) => {
  try {
    const {
      refreshToken,
    } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message:
          "Refresh token required",
      });
    }

    const user = await User.findOne({
      activeRefreshToken:
        refreshToken,
    });

    if (!user) {
      return res.status(403).json({
        message:
          "Refresh token is invalid or expired",
      });
    }

    const tokens =
      generateTokens(user._id);

    // Rotate refresh token.
    user.activeRefreshToken =
      tokens.refreshToken;

    await user.save();

    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

export const forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const tokenStr = crypto
      .randomBytes(32)
      .toString("hex");

    await Token.create({
      userId: user._id,
      token: tokenStr,
      type: "password-reset",
    });

    const domain =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    await sendPasswordResetEmail(
      user.email,
      tokenStr,
      domain
    );

    res.status(200).json({
      message:
        "Password reset link sent",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================

export const resetPassword = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
      newPassword,
    } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message:
          "Token and new password are required",
      });
    }

    const tokenDoc = await Token.findOne({
      token,
      type: "password-reset",
    });

    if (!tokenDoc) {
      return res.status(400).json({
        message:
          "Invalid or expired token",
      });
    }

    const user = await User.findById(
      tokenDoc.userId
    );

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    user.password = newPassword;

    // Reset password invalidates existing sessions.
    user.activeRefreshToken = null;

    await user.save();

    // Token is single-use.
    await tokenDoc.deleteOne();

    res.status(200).json({
      message:
        "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// VENDOR INVITES TEAM MEMBER
// ============================================================

export const inviteTeamMember = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      designation,
    } = req.body;

    const vendorId =
      req.user._id;

    if (!email) {
      return res.status(400).json({
        message:
          "Email is required",
      });
    }

    if (!designation) {
      return res.status(400).json({
        message:
          "Designation is required",
      });
    }

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User already exists",
      });
    }

    const tokenStr = crypto
      .randomBytes(32)
      .toString("hex");

    // --------------------------------------------------------
    // Create temporary Team Member account
    // --------------------------------------------------------

    const user = await User.create({
      email,

      // Temporary password.
      // The Team Member replaces this when accepting.
      password: crypto
        .randomBytes(16)
        .toString("hex"),

      role: "team-member",

      vendorId,

      designation,

      isEmailConfirmed: false,
    });

    // --------------------------------------------------------
    // Create invitation token
    // --------------------------------------------------------

    await Token.create({
      userId: user._id,
      token: tokenStr,
      type: "invitation",
    });

    // --------------------------------------------------------
    // Invitation email uses CLIENT_URL.
    // --------------------------------------------------------

    const domain =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    await sendInvitationEmail(
      user.email,
      tokenStr,
      domain,
      designation
    );

    res.status(200).json({
      message: "Invitation sent",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ACCEPT TEAM MEMBER INVITATION
// POST /api/auth/accept-invitation
// ============================================================

export const acceptInvitation = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
      firstName,
      lastName,
      password,
    } = req.body;

    if (
      !token ||
      !firstName ||
      !lastName ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Token, first name, last name and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long",
      });
    }

    const tokenDoc = await Token.findOne({
      token,
      type: "invitation",
    });

    if (!tokenDoc) {
      return res.status(400).json({
        message:
          "Invalid or expired invitation token",
      });
    }

    const user = await User.findById(
      tokenDoc.userId
    );

    if (!user) {
      return res.status(400).json({
        message:
          "The invited user could not be found",
      });
    }

    // Make sure this token belongs to a Team Member.
    if (user.role !== "team-member") {
      return res.status(400).json({
        message:
          "This invitation is not valid for a Team Member account",
      });
    }

    user.firstName = firstName;
    user.lastName = lastName;

    // User model hashes this automatically
    // through its pre-save middleware.
    user.password = password;

    // Accepting an invitation confirms the email.
    user.isEmailConfirmed = true;

    await user.save();

    // Invitation tokens are single-use.
    await tokenDoc.deleteOne();

    res.status(200).json({
      message:
        "Account registered successfully. You can now login.",
    });
  } catch (error) {
    next(error);
  }
};