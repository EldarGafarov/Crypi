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

  // Look up the user by email (always lowercase for consistency)
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });

  // Always run bcrypt.compare even if the user was not found (using DUMMY_HASH as fallback).
  // This prevents "timing attacks" — where an attacker can tell if an email exists
  // just because the server responds faster when skipping the bcrypt check.
  const passwordMatch = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  // Both conditions must be true: user exists AND password matches.
  // We give the same generic error for both cases so attackers can't tell which one failed.
  if (!user || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Credentials are correct — issue a JWT cookie and return the user info
  const token = signToken({ userId: user._id.toString(), username: user.username });
  res.setHeader('Set-Cookie', buildCookieHeader(token));
  res.status(200).json({ user: { userId: user._id.toString(), username: user.username } });
}
