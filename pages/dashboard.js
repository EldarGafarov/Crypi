import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import CoinCard from '../components/CoinCard';
import CoinIcon from '../components/CoinIcon';

const Dashboard = () => {
  const [coins, setCoins] = useState([]);
  const [prices, setPrices] = useState({});
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { isDarkMode } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const wsRef = useRef(null);
  const searchTimer = useRef(null);

  // Load the correct coin list once auth state is resolved.
  // Guests get the top 10 by Binance volume.
  // Logged-in users get their saved list, or top 10 if they haven't set one yet.
  useEffect(() => {
    if (authLoading) return;

    const loadCoins = async () => {
      setCoinsLoading(true);

      if (!user) {
        const res = await fetch('/api/coins/top');
        const data = await res.json();
        setCoins(data.coins || []);
      } else {
        const res = await fetch('/api/coins/user');
        const data = await res.json();

        if (data.coins && data.coins.length > 0) {
          setCoins(data.coins);
        } else {
          // First visit: seed with top 10 so the dashboard isn't empty
          const topRes = await fetch('/api/coins/top');
          const topData = await topRes.json();
          setCoins(topData.coins || []);
        }
      }

      setCoinsLoading(false);
    };

    loadCoins();
  }, [user, authLoading]);

  // Reconnect WebSocket whenever the coin list changes so it always streams the right coins.
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

  // Debounced search: fires 300ms after the user stops typing in the modal input.
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

  // Persist the updated coin list to the database for the logged-in user.
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

  if (authLoading || coinsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white dark:bg-gray-900 transition-colors duration-200 px-4 pt-24">

      {/* Add Coin button — only visible to logged-in users */}
      {user && (
        <div className="w-full max-w-screen-lg flex justify-end mb-4">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition text-sm"
          >
            + Add Coin
          </button>
        </div>
      )}

      {/* Title for guests only */}
      {!user && (
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Top 10 Trading Coins
        </h1>
      )}

      {/* Coin grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-screen-lg w-full">
        {coins.map((coin) => (
          <CoinCard
            key={coin.symbol}
            coin={coin}
            price={prices[coin.symbol]}
            onRemove={user ? removeCoin : undefined}
          />
        ))}
      </div>

      {/* Add Coin Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>

            {/* Modal header */}
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

            {/* Search input */}
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

            {/* Results list */}
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
};

export default Dashboard;
