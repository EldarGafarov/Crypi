import { connectToDatabase } from '../../../lib/mongodb';
import { getAuthenticatedUser } from '../../../lib/auth';

// Validates that a symbol is a real-looking Binance USDT pair (uppercase letters/numbers, ends in USDT).
// This replaced the old hardcoded whitelist so any coin the user adds to their dashboard can also be tracked in their wallet.
const isValidSymbol = (symbol) => typeof symbol === 'string' && /^[A-Z0-9]+USDT$/.test(symbol);

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // Security check: verify the JWT cookie AND confirm the session is still active in the DB.
  const user = await getAuthenticatedUser(req, db);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // GET = load the user's wallet from the database
  if (req.method === 'GET') {
    const wallet = await db.collection('wallets').findOne({ userId: user.userId });
    // If the user has never saved a wallet before, return an empty array instead of null
    return res.status(200).json({ holdings: wallet?.holdings || [] });
  }

  // POST = save the user's wallet to the database
  if (req.method === 'POST') {
    const { holdings } = req.body;

    if (!Array.isArray(holdings))
      return res.status(400).json({ error: 'Holdings must be an array' });

    // Sanitize the data before saving:
    // 1. Filter out any coin symbols not in our whitelist
    // 2. Force amounts to be valid non-negative numbers
    const sanitized = holdings
      .filter((h) => isValidSymbol(h.symbol))
      .map((h) => ({
        symbol: h.symbol,
        amount: Math.max(0, parseFloat(h.amount) || 0),
      }));

    // upsert: true means — update the wallet if it exists, create it if it doesn't.
    // This ensures each user always has exactly one wallet document.
    await db.collection('wallets').updateOne(
      { userId: user.userId },
      { $set: { userId: user.userId, holdings: sanitized } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Wallet saved' });
  }

  // Any other HTTP method (PUT, DELETE, etc.) is not allowed
  res.status(405).end();
}
