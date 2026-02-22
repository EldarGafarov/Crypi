// Fetches coin image URLs from CoinGecko and caches them in memory for 1 hour.
// This avoids hitting CoinGecko on every API request while keeping images fresh.
// Falls back gracefully if CoinGecko is unavailable.

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getCoinImages() {
  // Return cached data if it's still fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;

  try {
    // Fetch top 250 coins by volume — covers virtually all coins a user would search for
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1',
      { headers: { Accept: 'application/json' } }
    );

    if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);

    const coins = await res.json();

    // Build a map: lowercase symbol (e.g. "btc") → image URL
    const map = {};
    for (const coin of coins) {
      map[coin.symbol.toLowerCase()] = coin.image;
    }

    cache = map;
    cacheTime = Date.now();
    return cache;
  } catch (err) {
    console.warn('CoinGecko image fetch failed, using cached or empty map:', err.message);
    // Return whatever we have cached (even if stale), or an empty map
    return cache || {};
  }
}
