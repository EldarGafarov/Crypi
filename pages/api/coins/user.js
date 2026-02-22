import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromRequest } from '../../../lib/auth';
import { getCoinImages } from '../../../lib/coinImages';

export default async function handler(req, res) {
  // Requires authentication — guests cannot save a personal coin list
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { db } = await connectToDatabase();

  // GET — return the user's saved coin list, with images resolved fresh from CoinGecko
  if (req.method === 'GET') {
    const doc = await db.collection('userCoins').findOne({ userId: user.userId });
    const saved = doc?.coins || [];

    if (saved.length === 0) return res.status(200).json({ coins: [] });

    // Always resolve images at request time so stored coins are never stuck with stale URLs
    const images = await getCoinImages();
    const coins = saved.map((c) => {
      const base = c.symbol.replace('USDT', '');
      return {
        symbol: c.symbol,
        name: c.name || base,
        image: images[base.toLowerCase()] || '',
      };
    });

    return res.status(200).json({ coins });
  }

  // POST — save the user's coin list (only symbol + name, no image — resolved fresh on GET)
  if (req.method === 'POST') {
    const { coins } = req.body;

    if (!Array.isArray(coins))
      return res.status(400).json({ error: 'coins must be an array' });

    // Validate symbol format and strip the image field — images are always resolved fresh
    const valid = coins
      .filter((c) => c.symbol && /^[A-Z0-9]+USDT$/.test(c.symbol))
      .map((c) => ({
        symbol: c.symbol,
        name: c.name || c.symbol.replace('USDT', ''),
      }));

    await db.collection('userCoins').updateOne(
      { userId: user.userId },
      { $set: { userId: user.userId, coins: valid } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Saved' });
  }

  res.status(405).end();
}
