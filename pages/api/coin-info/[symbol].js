import { getCoinMarketData } from '@/lib/coinImages';

// Returns enriched coin data for the detail page.
// All data comes from the CoinGecko cache — no DB, no extra API calls.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { symbol } = req.query; // e.g. "BTCUSDT"
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  // Strip USDT to get the base symbol CoinGecko uses (e.g. "btc")
  const base = symbol.replace(/USDT$/i, '').toLowerCase();

  const marketData = await getCoinMarketData();
  const coin = marketData[base];

  if (!coin) {
    return res.status(404).json({ error: `No market data found for ${base.toUpperCase()}` });
  }

  return res.status(200).json(coin);
}
