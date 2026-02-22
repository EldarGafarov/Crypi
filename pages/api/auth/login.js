import { connectToDatabase } from '../../../lib/mongodb';
import { signToken, buildCookieHeader } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

// A fake bcrypt hash used as a decoy when the email doesn't exist in the database.
// This ensures the login always takes the same amount of time whether the email exists or not,
// preventing attackers from figuring out which emails are registered by measuring response time.
const DUMMY_HASH = '$2b$12$invalidhashfortimingprotection0000000000000000';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const { db } = await connectToDatabase();

  const user = await db.collection('users').findOne({ email: email.toLowerCase() });

  // Always run bcrypt.compare even if the user was not found (timing attack prevention)
  const passwordMatch = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  if (!user || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Block login if the user has not verified their email yet
  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      pendingVerification: true,
    });
  }

  const token = signToken({ userId: user._id.toString(), username: user.username });
  res.setHeader('Set-Cookie', buildCookieHeader(token));
  res.status(200).json({ user: { userId: user._id.toString(), username: user.username } });
}
