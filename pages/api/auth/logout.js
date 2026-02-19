import { clearCookieHeader } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  // Overwrite the cookie with an expired one — the browser deletes it immediately.
  // After this, the user's JWT is gone and they are effectively logged out.
  res.setHeader('Set-Cookie', clearCookieHeader());
  res.status(200).json({ message: 'Logged out' });
}
