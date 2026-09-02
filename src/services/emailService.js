import nodemailer from "nodemailer";

// ============================================================
// SMTP TRANSPORTER
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
// GENERIC EMAIL SENDER
// ============================================================

const sendEmail = async (
  to,
  subject,
  text,
  html
) => {
  try {
    const info = await transporter.sendMail({
      from: `"CRM Backend" <${
        process.env.FROM_EMAIL ||
        "noreply@crm.local"
      }>`,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `Email sent to ${to}: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      `Error sending email to ${to}:`,
      error
    );

    throw error;
  }
};


// ============================================================
// EMAIL CONFIRMATION
//
// Confirmation is handled directly by the backend.
//
// Local:
// http://localhost:5000/api/auth/confirm-email?token=...
//
// Production:
// https://your-backend-domain/api/auth/confirm-email?token=...
// ============================================================

const sendConfirmationEmail = async (
  to,
  token
) => {
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

    <html>
      <body
        style="
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background: #f8fafc;
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
            Thank you for registering.
            Please confirm your email address
            by clicking the button below.
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
            paste the following URL into your browser:
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
//
// The invitation must open the FRONTEND.
//
// Local:
// http://localhost:5173/accept-invitation?token=...
//
// Production:
// https://leadms-one.vercel.app/accept-invitation?token=...
//
// The frontend will then send:
// POST /api/auth/accept-invitation
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

    <html>
      <body
        style="
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background: #f8fafc;
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
              line-height: 1.6;
            "
          >
            If the button does not work, copy and
            paste the following URL into your browser:
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
//
// This currently uses the frontend domain.
// The frontend reset page receives the token and
// sends the new password to the backend.
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

    <html>
      <body
        style="
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background: #f8fafc;
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
              line-height: 1.6;
            "
          >
            If the button does not work, copy and
            paste the following URL into your browser:
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