import { connectToDatabase } from '../../../lib/mongodb';
import { clearCookieHeader, getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Decode the token to get the jti (session id) and delete it from the DB.
  // This immediately invalidates the token — anyone holding a copy can no longer use it.
  const decoded = getUserFromRequest(req);
  if (decoded?.jti) {
    const { db } = await connectToDatabase();
    await db.collection('sessions').deleteOne({ jti: decoded.jti });
  }

  res.setHeader('Set-Cookie', clearCookieHeader());
  res.status(200).json({ message: 'Logged out' });
}
