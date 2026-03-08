import { connectToDatabase } from '../../../lib/mongodb';
import { sendPriceAlertEmail } from '../../../lib/email';

// This route is called by cron-job.org every minute.
// It is NOT protected by JWT — instead it checks a shared secret
// so only the cron service (and us) can trigger it.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const authHeader = req.headers['authorization'] || '';
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { db } = await connectToDatabase();

  // Fetch all alerts that have not yet been triggered
  const activeAlerts = await db
    .collection('alerts')
    .find({ triggered: false })
    .toArray();

  if (activeAlerts.length === 0) {
    return res.status(200).json({ checked: 0, triggered: 0 });
  }

  // Get unique symbols so we only make one Binance call per coin
  const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];

  // Fetch current prices from Binance REST for each unique symbol
  const priceMap = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
        );
        if (!response.ok) return;
        const data = await response.json();
        priceMap[symbol] = parseFloat(data.price);
      } catch {
        // If Binance is unreachable for this symbol, skip it this round
      }
    })
  );

  // Check each alert against the current price
  const triggeredIds = [];
  const emailPromises = [];

  for (const alert of activeAlerts) {
    const currentPrice = priceMap[alert.symbol];
    if (!currentPrice) continue;

    const crossed =
      (alert.direction === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.direction === 'below' && currentPrice <= alert.targetPrice);

    if (crossed) {
      triggeredIds.push(alert._id);
      emailPromises.push(
        sendPriceAlertEmail(alert.userEmail, {
          symbol: alert.symbol,
          targetPrice: alert.targetPrice,
          direction: alert.direction,
          currentPrice,
        })
      );
    }
  }

  // Mark triggered alerts so we don't email again
  if (triggeredIds.length > 0) {
    await db
      .collection('alerts')
      .updateMany(
        { _id: { $in: triggeredIds } },
        { $set: { triggered: true, triggeredAt: new Date() } }
      );

    // Send emails — don't let one failure block the others
    await Promise.allSettled(emailPromises);
  }

  return res.status(200).json({
    checked: activeAlerts.length,
    triggered: triggeredIds.length,
  });
}
