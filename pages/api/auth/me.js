import { connectToDatabase } from '../../../lib/mongodb';
import { getAuthenticatedUser } from '../../../lib/auth';

// This endpoint is called automatically by AuthContext every time the app loads.
// Its job is to answer the question: "is there a valid, active login session in this request?"
// This is how the app remembers you're logged in after a page refresh.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { db } = await connectToDatabase();
  // Decode the JWT AND verify the session is still active in the sessions collection.
  // If the user logged out (or someone else logged in), the session is gone and this returns 401.
  const user = await getAuthenticatedUser(req, db);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.status(200).json({ user: { userId: user.userId, username: user.username } });
}
