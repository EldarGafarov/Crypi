import { useState, useEffect, useRef } from 'react';

// Fetches the user's coin list (or top-10 for guests), loads Binance REST snapshot
// prices, then keeps prices live via WebSocket. Exposes addCoin/removeCoin which
// persist changes to /api/coins/user.
export function useCoinsWithPrices(user, authLoading) {
  const [coins, setCoins] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  // Load coin list + REST snapshot when auth state resolves.
  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);

      // 1. Fetch coin list
      let coinList = [];
      if (!user) {
        const res = await fetch('/api/coins/top');
        const data = await res.json();
        coinList = data.coins || [];
      } else {
        const res = await fetch('/api/coins/user');
        const data = await res.json();

        if (data.coins && data.coins.length > 0) {
          coinList = data.coins;
        } else {
          // First visit: seed with top 10 so the page isn't empty
          const topRes = await fetch('/api/coins/top');
          const topData = await topRes.json();
          coinList = topData.coins || [];
        }
      }

      // 2. Fetch REST snapshot so prices are correct on first render.
      //    WebSocket will keep them live after this.
      if (coinList.length > 0) {
        try {
          const symbols = JSON.stringify(coinList.map((c) => c.symbol));
          const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`);
          const priceData = await priceRes.json();
          const priceMap = {};
          priceData.forEach((d) => { priceMap[d.symbol] = parseFloat(d.price); });
          setPrices(priceMap);
        } catch {
          // REST failed — WebSocket will populate prices as trades arrive
        }
      }

      setCoins(coinList);
      setLoading(false);
    };

    load();
  }, [user, authLoading]);

  // Reconnect WebSocket whenever the coin list changes.
  useEffect(() => {
    if (coins.length === 0) return;

    if (wsRef.current) wsRef.current.close();

    const streams = coins.map((c) => `${c.symbol.toLowerCase()}@trade`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrices((prev) => ({ ...prev, [data.data.s]: parseFloat(data.data.p) }));
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => ws.close();
  }, [coins]);

  const saveCoinList = async (newCoins) => {
    await fetch('/api/coins/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins: newCoins }),
    });
  };

  const addCoin = async (coin) => {
    if (coins.find((c) => c.symbol === coin.symbol)) return;
    const newCoins = [...coins, coin];
    setCoins(newCoins);
    await saveCoinList(newCoins);
  };

  const removeCoin = async (symbol) => {
    const newCoins = coins.filter((c) => c.symbol !== symbol);
    setCoins(newCoins);
    await saveCoinList(newCoins);
  };

  return { coins, prices, loading, addCoin, removeCoin };
}
