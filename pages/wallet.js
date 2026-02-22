import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CoinIcon from '../components/CoinIcon';

export default function Wallet() {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [coins, setCoins] = useState([]);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [holdings, setHoldings] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const wsRef = useRef(null);
  const searchTimer = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  // Load the user's coin list — same source as the dashboard (/api/coins/user)
  // so adding/removing coins here also updates the dashboard.
  useEffect(() => {
    if (!user) return;

    const loadCoins = async () => {
      setCoinsLoading(true);
      const res = await fetch('/api/coins/user');
      const data = await res.json();

      if (data.coins && data.coins.length > 0) {
        setCoins(data.coins);
      } else {
        // First visit: seed with top 10
        const topRes = await fetch('/api/coins/top');
        const topData = await topRes.json();
        setCoins(topData.coins || []);
      }
      setCoinsLoading(false);
    };

    loadCoins();
  }, [user]);

  // Load saved holding amounts
  useEffect(() => {
    if (!user) return;
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        (data.holdings || []).forEach((h) => {
          map[h.symbol] = String(h.amount);
        });
        setHoldings(map);
      });
  }, [user]);

  // WebSocket: reconnects whenever the coin list changes
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

  // Debounced search for the Add Coin modal
  useEffect(() => {
    if (!showModal) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/coins/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.coins || []);
      setSearching(false);
    }, 300);
  }, [searchQuery, showModal]);

  const openModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowModal(true);
  };

  // Persists the coin list to /api/coins/user — shared with the dashboard
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
    setHoldings((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
    await saveCoinList(newCoins);
  };

  const totalValue = coins.reduce((sum, coin) => {
    const amount = parseFloat(holdings[coin.symbol]) || 0;
    const price = prices[coin.symbol] || 0;
    return sum + amount * price;
  }, 0);

  const handleAmountChange = (symbol, value) => {
    setHoldings((prev) => ({ ...prev, [symbol]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const holdingsArray = coins.map((c) => ({
      symbol: c.symbol,
      amount: parseFloat(holdings[c.symbol]) || 0,
    }));

    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings: holdingsArray }),
    });

    setSaving(false);
    setSaveStatus(res.ok ? 'saved' : 'error');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  if (loading || !user || coinsLoading) return null;

  return (
    <div className={`min-h-screen px-4 py-8 transition-colors duration-200
      ${isDarkMode ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto">

          {/* Go to Dashboard */}
        <div className="mb-6">
          <Link href="/dashboard">
            <span className="inline-block px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm transition cursor-pointer">
              ← Go to Dashboard
            </span>
          </Link>
        </div>

        {/* Total Value Banner */}
        <div className={`mb-8 p-6 rounded-xl shadow-xl text-center
          ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Portfolio Value
          </p>
          <p className="text-4xl font-bold text-cyan-400">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Updates in real time
          </p>
        </div>

        {/* Holdings Table */}
        <div className={`rounded-xl shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              My Holdings
            </h2>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition text-sm"
            >
              + Add Coin
            </button>
          </div>

          <div className="divide-y divide-gray-700/30">
            {coins.map((coin) => {
              const amount = parseFloat(holdings[coin.symbol]) || 0;
              const price = prices[coin.symbol] || 0;
              const subtotal = amount * price;

              return (
                <div key={coin.symbol} className="flex items-center gap-4 px-6 py-4">
                  <CoinIcon coin={coin} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {coin.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {price ? `$${price.toFixed(2)}` : 'Loading...'}
                    </p>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={holdings[coin.symbol] || ''}
                    onChange={(e) => handleAmountChange(coin.symbol, e.target.value)}
                    placeholder="0"
                    className={`w-28 px-3 py-1.5 rounded-lg border text-right outline-none transition text-sm
                      ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'}`}
                  />

                  <div className="w-32 text-right">
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <button
                    onClick={() => removeCoin(coin.symbol)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400 text-xs font-bold transition"
                    title="Remove coin"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-end gap-4">
          {saveStatus === 'saved' && (
            <span className="text-green-400 text-sm font-medium">Wallet saved!</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400 text-sm font-medium">Failed to save. Try again.</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Wallet'}
          </button>
        </div>
      </div>

      {/* Add Coin Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add Coin
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Search (e.g. BTC, ETH, SOL...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border mb-4 outline-none text-sm transition
                ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'}`}
            />

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {searching ? (
                <p className="text-center text-sm text-gray-400 py-4">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">
                  {searchQuery ? 'No coins found' : 'Start typing to search'}
                </p>
              ) : (
                searchResults.map((coin) => {
                  const alreadyAdded = !!coins.find((c) => c.symbol === coin.symbol);
                  return (
                    <div
                      key={coin.symbol}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <CoinIcon coin={coin} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {coin.name}
                        </p>
                        <p className="text-xs text-gray-400">{coin.symbol}</p>
                      </div>
                      <button
                        disabled={alreadyAdded}
                        onClick={() => { addCoin(coin); setShowModal(false); }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex-shrink-0
                          ${alreadyAdded
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-default'
                            : 'bg-cyan-500 hover:bg-cyan-600 text-white'}`}
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
