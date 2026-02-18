import nodemailer from "nodemailer";

export const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error(
      "CRITICAL: EMAIL_USER or EMAIL_PASS not found in environment variables",
    );
    throw new Error("Email configuration missing");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });
};

export const sendOTPEmail = async (email: string, otpCode: string) => {
  const mailOptions = {
    from: `"Sports Club Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 400px; padding: 40px 20px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #DD1D25;">Sports Club</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #555; margin-bottom: 32px;">
          Use the following code to complete your verification. This code expires in 10 minutes.
        </p>
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 4px; color: #111; margin-bottom: 40px;">
          ${otpCode}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 24px;" />
        <p style="font-size: 12px; color: #999;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[Email] OTP sent to ${email}`);
};

export const sendUserCredentialsEmail = async (
  email: string,
  password: string,
  name: string,
  role: string,
) => {
  const roleLabels: Record<string, string> = {
    admin: "Executive",
    superuser: "Staff",
    moderator: "General Member",
    user: "Student",
  };

  const roleLabel = roleLabels[role] || "Member";

  const mailOptions = {
    from: `"Sports Club Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Portal Access",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 450px; padding: 40px 20px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #DD1D25;">Sports Club</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #111; margin-bottom: 8px;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #555; margin-bottom: 32px;">
          Your account has been created with the following details.
        </p>
        
        <div style="margin-bottom: 32px;">
          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Email</span><br/>
            <span style="font-size: 15px; font-weight: 500;">${email}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Password</span><br/>
            <span style="font-size: 15px; font-weight: 500;">${password}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">Role</span><br/>
            <span style="font-size: 15px; font-weight: 500;">${roleLabel}</span>
          </div>
        </div>

        <a href="${process.env.CLIENT_URL || "#"}/login" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 40px;">
          Go to Dashboard
        </a>

        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 24px;" />
        <p style="font-size: 12px; color: #999; line-height: 1.6;">
          Please change your password after logging in. This is a system generated email.
        </p>
      </div>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`[Email] Credentials sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send credentials:", error);
  }
};

export const sendMembershipApplicationEmail = async (
  email: string,
  name: string,
  appliedRole: string,
) => {
  const roleLabel =
    appliedRole === "moderator"
      ? "General member position"
      : "Student position";

  const mailOptions = {
    from: `"Sports Club Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Membership Application Received",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 450px; padding: 40px 20px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #DD1D25;">Sports Club</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #111; margin-bottom: 8px;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #555; margin-bottom: 32px;">
          Thank you for applying for the <strong>${roleLabel}</strong>. We have received your application and are currently reviewing it.
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #555; margin-bottom: 32px;">
          You will receive another email once a decision has been made.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 24px;" />
        <p style="font-size: 12px; color: #999;">
          This is a system generated email.
        </p>
      </div>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`[Email] Application confirmation sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send application email:", error);
  }
};

export const sendMembershipStatusEmail = async (
  email: string,
  name: string,
  status: string,
  appliedRole: string,
  note?: string,
) => {
  const roleLabel = appliedRole === "moderator" ? "General member" : "Student";

  const subject =
    status === "approved"
      ? "Membership Application Approved"
      : "Membership Application Update";

  const message =
    status === "approved"
      ? `Congratulations! Your application for <strong>${roleLabel}</strong> has been <strong>approved</strong>.`
      : `We regret to inform you that your application for <strong>${roleLabel}</strong> has been <strong>rejected</strong>.`;

  const mailOptions = {
    from: `"Sports Club Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 450px; padding: 40px 20px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #DD1D25;">Sports Club</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #111; margin-bottom: 8px;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #555; margin-bottom: 32px;">
          ${message}
        </p>
        ${
          note
            ? `
        <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 32px; border: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">Note from Admin</p>
          <p style="font-size: 14px; color: #555; margin: 0; font-style: italic;">"${note}"</p>
        </div>
        `
            : ""
        }
        ${
          status === "approved"
            ? `
        <a href="${process.env.CLIENT_URL || "#"}/login" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 40px;">
          Login to Portal
        </a>
        `
            : ""
        }
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 24px;" />
        <p style="font-size: 12px; color: #999;">
          This is a system generated email.
        </p>
      </div>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`[Email] Status update sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send status email:", error);
  }
};

export const sendAnnouncementEmail = async (
  email: string,
  userName: string,
  title: string,
  content: string,
) => {
  const mailOptions = {
    from: `"Sports Club Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Announcement: ${title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; padding: 40px 20px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #DD1D25;">Sports Club Announcement</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #111; margin-bottom: 16px;">
          Hello <strong>${userName}</strong>,
        </p>
        <div style="background-color: #f9f9f9; padding: 24px; border-radius: 12px; border: 1px solid #eee; margin-bottom: 32px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #111;">${title}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0; white-space: pre-wrap;">${content}</p>
        </div>
        <a href="${process.env.CLIENT_URL || "#"}/dashboard/announcements" style="display: inline-block; background-color: #DD1D25; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 40px;">
          View on Dashboard
        </a>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 24px;" />
        <p style="font-size: 11px; color: #999; line-height: 1.6;">
          You are receiving this email because you have notifications enabled. You can manage your preferences in the Settings page.
        </p>
      </div>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`[Email] Announcement sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send announcement email:", error);
  }
};
