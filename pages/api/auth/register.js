import { connectToDatabase } from '../../../lib/mongodb';
import { signToken, buildCookieHeader } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Only allow POST requests — reject everything else.
  if (req.method !== 'POST') return res.status(405).end();

  const { username, email, password } = req.body;

  // --- Input validation (runs on the server, not just the browser) ---
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (username.length < 3 || username.length > 30)
    return res.status(400).json({ error: 'Username must be 3–30 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email format' });
  //Need to add here more REGEX IF BENZAKAI WANTS
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { db } = await connectToDatabase();

  // Check if this email or username already exists in the database.
  // $or means: find a user where email matches OR username matches.
  const existing = await db.collection('users').findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (existing) {
    // Tell the user specifically which field is taken (better UX)
    const field = existing.email === email.toLowerCase() ? 'email' : 'username';
    return res.status(409).json({ error: `That ${field} is already taken` });
  }

  // Hash the password before saving. bcrypt scrambles it 2^12 = 4096 times.
  // Hashed password goes into DB
  const passwordHash = await bcrypt.hash(password, 12);

  // Insert the new user document into the 'users' collection
  const result = await db.collection('users').insertOne({
    username,
    email: email.toLowerCase(), // always store emails in lowercase for consistency
    passwordHash,
    createdAt: new Date(),
  });

  // Log the user in immediately after registering by issuing a JWT cookie
  const token = signToken({ userId: result.insertedId.toString(), username });
  res.setHeader('Set-Cookie', buildCookieHeader(token));
  // 201 = "Created" — standard HTTP status for a successful resource creation
  res.status(201).json({ user: { userId: result.insertedId.toString(), username } });
}
