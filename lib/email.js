import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, username, token) {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const link = `${base}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'Crypi <noreply@crypi.live>',
    to: toEmail,
    subject: 'Verify your Crypi account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#111827;color:#f9fafb;border-radius:12px">
        <h2 style="color:#22d3ee;margin-top:0">Welcome to Crypi, ${username}!</h2>
        <p style="color:#d1d5db">Click the button below to verify your email address. The link expires in <strong>24 hours</strong>.</p>
        <a href="${link}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#22d3ee;color:#000;font-weight:700;border-radius:8px;text-decoration:none">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:13px">If you didn't create an account, you can ignore this email.</p>
        <p style="color:#374151;font-size:12px;margin-top:32px;border-top:1px solid #374151;padding-top:16px">
          Or copy this link: <span style="color:#22d3ee">${link}</span>
        </p>
      </div>
    `,
  });
}
