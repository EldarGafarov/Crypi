import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromRequest } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;

  let alertId;
  try {
    alertId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: 'Invalid alert id' });
  }

  const { db } = await connectToDatabase();

  // Only delete if it belongs to this user
  const result = await db.collection('alerts').deleteOne({
    _id: alertId,
    userId: user.userId,
  });

  if (result.deletedCount === 0)
    return res.status(404).json({ error: 'Alert not found' });

  return res.status(200).json({ message: 'Alert deleted' });
}
