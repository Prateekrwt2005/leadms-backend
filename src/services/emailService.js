import nodemailer from "nodemailer";

// ============================================================
// GMAIL SMTP TRANSPORTER
// ============================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================================
// VERIFY SMTP CONNECTION
// ============================================================

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection failed:");
    console.error(error.message);
  } else {
    console.log("✅ Gmail SMTP connection ready");
  }
});

// ============================================================
// GENERIC EMAIL SENDER
// ============================================================

const sendEmail = async (to, subject, text, html) => {
  try {
    console.log("==============================================");
    console.log("📧 Preparing email");
    console.log("To:", to);
    console.log("Subject:", subject);

    if (!process.env.SMTP_USER) {
      throw new Error("SMTP_USER is not configured");
    }

    if (!process.env.SMTP_PASS) {
      throw new Error("SMTP_PASS is not configured");
    }

    const mailOptions = {
      from:
        process.env.FROM_EMAIL ||
        process.env.SMTP_USER,

      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("==============================================");

    return info;
  } catch (error) {
    console.error("==============================================");
    console.error("❌ EMAIL SEND ERROR");
    console.error("Message:", error.message);
    console.error("==============================================");

    throw error;
  }
};

// ============================================================
// EMAIL CONFIRMATION
// ============================================================

const sendConfirmationEmail = async (to, token) => {
  const backendUrl =
    process.env.BACKEND_URL ||
    "http://localhost:5000";

  const url =
    `${backendUrl}/api/auth/confirm-email?token=${encodeURIComponent(
      token
    )}`;

  const subject =
    "Welcome! Please confirm your email";

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Confirm your LeadMS account</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f8fafc;
    font-family: Arial, sans-serif;
  "
>

  <div
    style="
      max-width: 600px;
      margin: 40px auto;
      padding: 32px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    "
  >

    <h1
      style="
        margin-top: 0;
        color: #1e293b;
      "
    >
      Welcome to LeadMS
    </h1>

    <p
      style="
        color: #475569;
        line-height: 1.6;
      "
    >
      Thank you for registering with LeadMS.
      Please confirm your email address by
      clicking the button below.
    </p>

    <p>
      <a
        href="${url}"
        style="
          display: inline-block;
          padding: 12px 22px;
          background: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        "
      >
        Confirm Email
      </a>
    </p>

    <p
      style="
        color: #64748b;
        font-size: 14px;
        line-height: 1.6;
      "
    >
      If the button does not work, copy and
      paste this URL into your browser:
    </p>

    <p
      style="
        color: #64748b;
        font-size: 13px;
        word-break: break-all;
      "
    >
      ${url}
    </p>

  </div>

</body>
</html>
`;

  return sendEmail(
    to,
    subject,
    url,
    html
  );
};

// ============================================================
// TEAM MEMBER INVITATION
// ============================================================

const sendInvitationEmail = async (
  to,
  token,
  domain,
  designation
) => {
  const url =
    `${domain}/accept-invitation?token=${encodeURIComponent(
      token
    )}`;

  const subject =
    "You are invited to join LeadMS as a Team Member";

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>LeadMS Team Invitation</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f8fafc;
    font-family: Arial, sans-serif;
  "
>

  <div
    style="
      max-width: 600px;
      margin: 40px auto;
      padding: 32px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    "
  >

    <h1
      style="
        margin-top: 0;
        color: #1e293b;
      "
    >
      LeadMS Team Invitation
    </h1>

    <p
      style="
        color: #475569;
        line-height: 1.6;
      "
    >
      You have been invited to join LeadMS
      as a
      <strong>${designation}</strong>.
    </p>

    <p
      style="
        color: #475569;
        line-height: 1.6;
      "
    >
      Click the button below to accept your
      invitation and create your Team Member
      account.
    </p>

    <p>
      <a
        href="${url}"
        style="
          display: inline-block;
          padding: 12px 22px;
          background: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        "
      >
        Accept Invitation
      </a>
    </p>

    <p
      style="
        color: #64748b;
        font-size: 14px;
      "
    >
      If the button does not work, copy and
      paste this URL into your browser:
    </p>

    <p
      style="
        color: #64748b;
        font-size: 13px;
        word-break: break-all;
      "
    >
      ${url}
    </p>

  </div>

</body>
</html>
`;

  return sendEmail(
    to,
    subject,
    url,
    html
  );
};

// ============================================================
// PASSWORD RESET
// ============================================================

const sendPasswordResetEmail = async (
  to,
  token,
  domain
) => {
  const url =
    `${domain}/reset-password?token=${encodeURIComponent(
      token
    )}`;

  const subject =
    "LeadMS Password Reset Request";

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Reset your LeadMS password</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f8fafc;
    font-family: Arial, sans-serif;
  "
>

  <div
    style="
      max-width: 600px;
      margin: 40px auto;
      padding: 32px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    "
  >

    <h1
      style="
        margin-top: 0;
        color: #1e293b;
      "
    >
      Reset Your Password
    </h1>

    <p
      style="
        color: #475569;
        line-height: 1.6;
      "
    >
      You requested a password reset for
      your LeadMS account.
    </p>

    <p
      style="
        color: #475569;
        line-height: 1.6;
      "
    >
      Click the button below to create a
      new password.
    </p>

    <p>
      <a
        href="${url}"
        style="
          display: inline-block;
          padding: 12px 22px;
          background: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        "
      >
        Reset Password
      </a>
    </p>

    <p
      style="
        color: #64748b;
        font-size: 14px;
      "
    >
      If the button does not work, copy and
      paste this URL into your browser:
    </p>

    <p
      style="
        color: #64748b;
        font-size: 13px;
        word-break: break-all;
      "
    >
      ${url}
    </p>

  </div>

</body>
</html>
`;

  return sendEmail(
    to,
    subject,
    url,
    html
  );
};

// ============================================================
// EXPORTS
// ============================================================

export {
  sendEmail,
  sendConfirmationEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
};