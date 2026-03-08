import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPriceAlertEmail(toEmail, { symbol, targetPrice, direction, currentPrice }) {
  const coinName = symbol.replace('USDT', '');
  const directionWord = direction === 'above' ? 'risen above' : 'fallen below';
  const formatPrice = (p) =>
    p >= 1 ? p.toLocaleString('en-US', { maximumFractionDigits: 2 }) : p.toPrecision(4);

  await resend.emails.send({
    from: 'Crypi <noreply@crypi.live>',
    to: toEmail,
    subject: `Price Alert: ${coinName} hit $${formatPrice(currentPrice)}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#111827;color:#f9fafb;border-radius:12px">
        <h2 style="color:#22d3ee;margin-top:0">Price Alert Triggered</h2>
        <p style="color:#d1d5db;font-size:16px">
          <strong style="color:#f9fafb">${coinName}</strong> has ${directionWord} your target price.
        </p>
        <div style="background:#1f2937;border-radius:8px;padding:20px;margin:24px 0">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#9ca3af">Current price</span>
            <span style="color:#22d3ee;font-weight:700;font-size:18px">$${formatPrice(currentPrice)}</span>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#9ca3af">Your target</span>
            <span style="color:#f9fafb">$${formatPrice(targetPrice)} (${direction})</span>
          </div>
        </div>
        <p style="color:#6b7280;font-size:13px">
          This alert has been deactivated. You can set a new one anytime from your Crypi wallet.
        </p>
      </div>
    `,
  });
}

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
