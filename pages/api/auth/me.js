import { getUserFromRequest } from '../../../lib/auth';

// This endpoint is called automatically by AuthContext every time the app loads.
// Its job is to answer the question: "is there a valid login cookie in this request?"
// This is how the app remembers you're logged in after a page refresh.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  // Read and verify the JWT from the incoming cookie header
  const user = getUserFromRequest(req);
  // 401 = "Unauthorized" — no valid cookie found, treat as logged out
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  // Return only the safe fields — never expose the full JWT payload
  res.status(200).json({ user: { userId: user.userId, username: user.username } });
}
