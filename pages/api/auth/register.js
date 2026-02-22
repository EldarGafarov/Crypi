import { connectToDatabase } from '../../../lib/mongodb';
import { signToken, buildCookieHeader } from '../../../lib/auth';
import { sendVerificationEmail } from '../../../lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, email, password } = req.body;

  // --- Input validation ---
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (username.length < 3 || username.length > 30)
    return res.status(400).json({ error: 'Username must be 3–30 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { db } = await connectToDatabase();

  const existing = await db.collection('users').findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (existing) {
    const field = existing.email === email.toLowerCase() ? 'email' : 'username';
    return res.status(409).json({ error: `That ${field} is already taken` });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate a secure random token that expires in 24 hours
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.collection('users').insertOne({
    username,
    email: email.toLowerCase(),
    passwordHash,
    emailVerified: false,
    verificationToken,
    verificationTokenExpiry,
    createdAt: new Date(),
  });

  // Send verification email — if it fails, still return success so the user
  // knows the account was created, but warn them to check spam or retry
  try {
    await sendVerificationEmail(email.toLowerCase(), username, verificationToken);
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return res.status(201).json({
      pendingVerification: true,
      warning: 'Account created but we could not send the verification email. Please contact support.',
    });
  }

  // Do NOT log the user in yet — they must verify their email first
  res.status(201).json({ pendingVerification: true });
}
