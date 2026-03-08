import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromRequest } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

const isValidSymbol = (symbol) => typeof symbol === 'string' && /^[A-Z0-9]+USDT$/.test(symbol);

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { db } = await connectToDatabase();

  // GET — fetch all active (non-triggered) alerts for this user
  if (req.method === 'GET') {
    const alerts = await db
      .collection('alerts')
      .find({ userId: user.userId, triggered: false })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ alerts });
  }

  // POST — create a new alert
  if (req.method === 'POST') {
    const { symbol, targetPrice, direction } = req.body;

    if (!isValidSymbol(symbol))
      return res.status(400).json({ error: 'Invalid symbol' });

    const price = parseFloat(targetPrice);
    if (!price || price <= 0)
      return res.status(400).json({ error: 'Invalid target price' });

    if (direction !== 'above' && direction !== 'below')
      return res.status(400).json({ error: 'Direction must be above or below' });

    // Fetch the user's email from DB (not stored in JWT)
    const dbUser = await db.collection('users').findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { email: 1 } }
    );
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const alert = {
      userId: user.userId,
      userEmail: dbUser.email,
      symbol,
      targetPrice: price,
      direction,
      triggered: false,
      createdAt: new Date(),
    };

    const result = await db.collection('alerts').insertOne(alert);

    return res.status(201).json({ alert: { ...alert, _id: result.insertedId } });
  }

  res.status(405).end();
}
