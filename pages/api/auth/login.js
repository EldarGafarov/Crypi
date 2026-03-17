import { connectToDatabase } from '@/lib/mongodb';
import { signToken, buildCookieHeader } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const DUMMY_HASH = '$2b$12$invalidhashfortimingprotection0000000000000000';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { identifier, password } = req.body; // identifier = email or username

  if (!identifier || !password)
    return res.status(400).json({ error: 'Email/username and password are required' });

  const { db } = await connectToDatabase();

  // Look up by email (lowercase) OR by username
  const isEmail = identifier.includes('@');
  const user = await db.collection('users').findOne(
    isEmail
      ? { email: identifier.toLowerCase() }
      : { username: identifier }
  );

  // Always run bcrypt even if user not found (timing attack prevention)
  const passwordMatch = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  if (!user || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      pendingVerification: true,
    });
  }

  const { token, jti } = signToken({ userId: user._id.toString(), username: user.username });

  // Store the session in the DB — logout or a new login will delete it,
  // immediately invalidating any copied token.
  await db.collection('sessions').insertOne({
    jti,
    userId: user._id.toString(),
    createdAt: new Date(),
  });

  res.setHeader('Set-Cookie', buildCookieHeader(token));
  res.status(200).json({ user: { userId: user._id.toString(), username: user.username } });
}
