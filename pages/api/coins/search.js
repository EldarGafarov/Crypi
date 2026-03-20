import { getCoinImages } from '@/lib/coinImages';

// Searches Binance USDT pairs by a query string, enriched with CoinGecko images.
// Results are sorted by 24h quote volume so the most popular coins appear first.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { q = '' } = req.query;

  try {
    const [tickerRes, images] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/24hr'),
      getCoinImages(),
    ]);

    const tickers = await tickerRes.json();
    const query = q.toUpperCase().trim();

    const results = tickers
      .filter(
        (t) =>
          t.symbol.endsWith('USDT') &&
          !t.symbol.includes('UPUSDT') &&
          !t.symbol.includes('DOWNUSDT') &&
          !t.symbol.includes('BEARUSDT') &&
          !t.symbol.includes('BULLUSDT') &&
          (query === '' || t.symbol.startsWith(query))
      )
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20)
      .map((t) => {
        const base = t.symbol.replace('USDT', '');
        return {
          symbol: t.symbol,
          name: base,
          image: images[base.toLowerCase()] || '',
        };
      });

    return res.status(200).json({ coins: results });
  } catch (err) {
    console.error('Failed to search coins:', err);
    return res.status(500).json({ error: 'Failed to search coins' });
  }
}
