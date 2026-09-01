import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"CRM Backend" <${process.env.FROM_EMAIL || 'noreply@crm.local'}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

const sendConfirmationEmail = async (to, token, domain) => {
  const url = `${domain}/api/auth/confirm-email?token=${token}`;
  const subject = 'Welcome! Please confirm your email';
  const html = `<h1>Welcome to CRM Backend</h1>
                <p>Please click the link below to confirm your account:</p>
                <a href="${url}">${url}</a>`;
  return sendEmail(to, subject, url, html);
};

const sendInvitationEmail = async (to, token, domain, designation) => {
  const url = `${domain}/api/auth/accept-invitation?token=${token}`;
  const subject = 'You are invited to join the CRM as a Team Member';
  const html = `<h1>Invitation</h1>
                <p>You have been invited to join as a <strong>${designation}</strong>.</p>
                <p>Please click the link below to accept the invitation and register your account:</p>
                <a href="${url}">${url}</a>`;
  return sendEmail(to, subject, url, html);
};

const sendPasswordResetEmail = async (to, token, domain) => {
  const url = `${domain}/api/auth/reset-password?token=${token}`;
  const subject = 'Password Reset Request';
  const html = `<h1>Reset Password</h1>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="${url}">${url}</a>`;
  return sendEmail(to, subject, url, html);
};

export {
  sendEmail,
  sendConfirmationEmail,
  sendInvitationEmail,
  sendPasswordResetEmail
};
