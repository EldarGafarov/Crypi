// Fetches coin data from CoinGecko and caches it in memory for 1 hour.
// Previously only stored image URLs — now stores the full market object
// (name, image, market cap, rank, ATH, supply) so every part of the app
// can get rich coin data without extra API calls.

let cache = null; // { symbol: { name, image, market_cap, market_cap_rank, ath, ... } }
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchAndCache() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1',
      { headers: { Accept: 'application/json' } }
    );

    if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);

    const coins = await res.json();

    const map = {};
    for (const coin of coins) {
      map[coin.symbol.toLowerCase()] = {
        name: coin.name,
        image: coin.image,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        ath: coin.ath,
        ath_change_percentage: coin.ath_change_percentage,
        ath_date: coin.ath_date,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
      };
    }

    cache = map;
    cacheTime = Date.now();
    return cache;
  } catch (err) {
    console.warn('CoinGecko fetch failed, using cached or empty map:', err.message);
    return cache || {};
  }
}

// Returns { symbol: imageUrl } — used by top.js, search.js, user.js (unchanged)
export async function getCoinImages() {
  const data = await fetchAndCache();
  const images = {};
  for (const [sym, coin] of Object.entries(data)) {
    images[sym] = coin.image;
  }
  return images;
}

// Returns the full market data map — used by the coin-info API route
export async function getCoinMarketData() {
  return fetchAndCache();
}
