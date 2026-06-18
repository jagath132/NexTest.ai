import nodemailer from "nodemailer";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.sendgrid.net",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    auth: {
      user: process.env.SMTP_USER || "apikey",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

const FROM = process.env.SMTP_FROM || "noreply@testforge.io";
const BRAND = "TestForge";

export async function sendPasswordResetEmail(to, resetUrl) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3d;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 32px 0" align="center"><div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:22px;font-weight:800;margin-bottom:16px">TF</div><h1 style="color:#ededf5;font-size:20px;font-weight:700;margin:0 0 4px">Reset Your Password</h1><p style="color:#6b6b8a;font-size:13px;margin:0 0 24px">Click the button below to reset your password. This link expires in 1 hour.</p></td></tr><tr><td align="center" style="padding:0 32px 32px"><a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;box-shadow:0 4px 16px rgba(124,58,237,0.35)">Reset Password</a><p style="color:#6b6b8a;font-size:12px;margin:16px 0 0;line-height:1.5">If you didn't request a password reset, you can safely ignore this email.<br>Your account security matters to us.</p></td></tr></table><p style="color:#4a4a5a;font-size:11px;margin-top:24px">&copy; ${new Date().getFullYear()} TestForge. All rights reserved.</p></td></tr></table></body></html>`;

  try {
    const transport = getTransport();
    await transport.sendMail({
      from: `"${BRAND}" <${FROM}>`,
      to,
      subject: "Reset Your TestForge Password",
      html,
    });
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("Failed to send password reset email:", err.message);
    return false;
  }
}
