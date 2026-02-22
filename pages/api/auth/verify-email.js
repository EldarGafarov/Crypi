import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const { db } = await connectToDatabase();

  const user = await db.collection('users').findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or already used verification link.' });
  }

  if (new Date() > new Date(user.verificationTokenExpiry)) {
    return res.status(400).json({ error: 'This verification link has expired. Please register again.' });
  }

  // Mark the user as verified and clear the token
  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set:   { emailVerified: true },
      $unset: { verificationToken: '', verificationTokenExpiry: '' },
    }
  );

  // Redirect to the verify-email page with a success flag
  res.redirect(302, '/verify-email?success=1');
}
