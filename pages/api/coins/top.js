import { getCoinImages } from '../../../lib/coinImages';

// Fetches the top 10 USDT trading pairs from Binance sorted by 24h quote volume,
// enriched with real coin images from CoinGecko (cached server-side for 1 hour).
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const [tickerRes, images] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/24hr'),
      getCoinImages(),
    ]);

    const tickers = await tickerRes.json();

    const top10 = tickers
      .filter(
        (t) =>
          t.symbol.endsWith('USDT') &&
          !t.symbol.includes('UPUSDT') &&
          !t.symbol.includes('DOWNUSDT') &&
          !t.symbol.includes('BEARUSDT') &&
          !t.symbol.includes('BULLUSDT')
      )
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10)
      .map((t) => {
        const base = t.symbol.replace('USDT', '');
        return {
          symbol: t.symbol,
          name: base,
          image: images[base.toLowerCase()] || '',
        };
      });

    return res.status(200).json({ coins: top10 });
  } catch (err) {
    console.error('Failed to fetch top coins:', err);
    return res.status(500).json({ error: 'Failed to fetch top coins' });
  }
}
