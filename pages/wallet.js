import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', image: '/images/bitcoin.png' },
  { symbol: 'ETHUSDT', name: 'Ethereum', image: '/images/ethereum.webp' },
  { symbol: 'BNBUSDT', name: 'Binance', image: '/images/binance.png' },
  { symbol: 'ADAUSDT', name: 'Cardano', image: '/images/cardano.png' },
  { symbol: 'SOLUSDT', name: 'Solana', image: '/images/solana.jpg' },
  { symbol: 'XRPUSDT', name: 'Ripple', image: '/images/ripple.png' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', image: '/images/doge.png' },
  { symbol: 'LTCUSDT', name: 'Litecoin', image: '/images/litecoin.png' },
  { symbol: 'XLMUSDT', name: 'Stellar', image: '/images/xlm.png' },
  { symbol: 'DOTUSDT', name: 'Polkadot', image: '/images/polkadot.png' },
];

export default function Wallet() {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [prices, setPrices] = useState({});
  const [holdings, setHoldings] = useState({});
  const [saveStatus, setSaveStatus] = useState(''); // 'saved' | 'error' | ''
  const [saving, setSaving] = useState(false);

  // Auth guard: if auth has finished loading and there is no user, redirect to login.
  // This protects the page from being accessed without being logged in.
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  // Once we know the user is logged in, load their saved coin amounts from the database.
  // Converts the array from the API into an object like: { BTCUSDT: '0.5', ETHUSDT: '2' }
  // so it's easy to look up by symbol in the inputs.
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

  // Open a single WebSocket connection to Binance that streams live trade prices
  // for all 10 coins at once. Every time a trade happens on Binance, onmessage fires
  // and we update the price for that specific coin in state.
  // The return () => ws.close() cleans up the connection when you leave the page.
  useEffect(() => {
    const streams = COINS.map((c) => `${c.symbol.toLowerCase()}@trade`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // ...prev spreads all existing prices, then we override just the one that changed
      setPrices((prev) => ({ ...prev, [data.data.s]: parseFloat(data.data.p) }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, []);

  // Calculates the total portfolio value by multiplying amount × price for each coin.
  // This recalculates on every render — so whenever prices update (every second from WebSocket)
  // or holdings change (when user types), the total updates automatically.
  const totalValue = COINS.reduce((sum, coin) => {
    const amount = parseFloat(holdings[coin.symbol]) || 0;
    const price = prices[coin.symbol] || 0;
    return sum + amount * price;
  }, 0);

  // Called every time the user types in an amount input.
  // Updates only the changed coin and keeps all other holdings intact using ...prev spread.
  const handleAmountChange = (symbol, value) => {
    setHoldings((prev) => ({ ...prev, [symbol]: value }));
  };

  // Sends the current holdings to the server to be saved in MongoDB.
  // Disables the button while saving, then shows a success or error message for 3 seconds.
  const handleSave = async () => {
    setSaving(true);
    const holdingsArray = COINS.map((c) => ({
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
    // Clear the status message after 3 seconds
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // Render nothing while auth is loading or if there's no user.
  // Without this, the wallet content would flash on screen for a moment before the redirect.
  if (loading || !user) return null;

  return (
    <div className={`min-h-screen px-4 py-8 transition-colors duration-200
      ${isDarkMode ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto">

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

        {/* Coin Holdings Table */}
        <div className={`rounded-xl shadow-xl overflow-hidden
          ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              My Holdings
            </h2>
          </div>

          <div className="divide-y divide-gray-700/30">
            {COINS.map((coin) => {
              const amount = parseFloat(holdings[coin.symbol]) || 0;
              const price = prices[coin.symbol] || 0;
              const subtotal = amount * price;

              return (
                <div key={coin.symbol} className="flex items-center gap-4 px-6 py-4">
                  {/* Coin image + name */}
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {coin.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {price ? `$${price.toFixed(2)}` : 'Loading...'}
                    </p>
                  </div>

                  {/* Amount input */}
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

                  {/* Subtotal */}
                  <div className="w-32 text-right">
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
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
    </div>
  );
}
