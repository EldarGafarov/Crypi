import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import CoinIcon from '../components/CoinIcon';
import AddCoinModal from '../components/AddCoinModal';
import { useCoinsWithPrices } from '../hooks/useCoinsWithPrices';

function BellIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export default function Wallet() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { coins, prices, loading: coinsLoading, addCoin, removeCoin } = useCoinsWithPrices(user, loading);

  const [holdings, setHoldings] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Alert state
  const [alerts, setAlerts] = useState([]);
  const [alertModal, setAlertModal] = useState(null); // coin object or null
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDirection, setAlertDirection] = useState('above');
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertError, setAlertError] = useState('');

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

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

  // Load active alerts
  useEffect(() => {
    if (!user) return;
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts || []));
  }, [user]);

  // Wallet's removeCoin also clears the local holdings entry
  const handleRemoveCoin = async (symbol) => {
    setHoldings((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
    await removeCoin(symbol);
  };

  const openAlertModal = (coin) => {
    setAlertModal(coin);
    setAlertPrice('');
    setAlertDirection('above');
    setAlertError('');
  };

  const createAlert = async () => {
    if (!alertModal) return;
    const price = parseFloat(alertPrice);
    if (!price || price <= 0) {
      setAlertError('Enter a valid price above 0');
      return;
    }
    setAlertSaving(true);
    setAlertError('');
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: alertModal.symbol, targetPrice: price, direction: alertDirection }),
    });
    const data = await res.json();
    setAlertSaving(false);
    if (!res.ok) {
      setAlertError(data.error || 'Failed to create alert');
      return;
    }
    setAlerts((prev) => [data.alert, ...prev]);
    setAlertPrice('');
  };

  const deleteAlert = async (id) => {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    setAlerts((prev) => prev.filter((a) => String(a._id) !== String(id)));
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
    <div className="min-h-screen px-4 py-8 transition-colors duration-200
      bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">
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
        <div className="mb-8 p-6 rounded-xl shadow-xl text-center bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
            Total Portfolio Value
          </p>
          <p className="text-4xl font-bold text-cyan-400">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
            Updates in real time
          </p>
        </div>

        {/* Holdings Table */}
        <div className="rounded-xl shadow-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div className="px-6 py-4 border-b flex items-center justify-between border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              My Holdings
            </h2>
            <button
              onClick={() => setShowModal(true)}
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
                <div key={coin.symbol} className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-4">
                  <CoinIcon coin={coin} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white truncate">
                      {coin.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    className="w-20 sm:w-28 px-2 sm:px-3 py-1.5 rounded-lg border text-right outline-none transition text-sm
                      bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                      focus:border-cyan-500 dark:focus:border-cyan-400"
                  />

                  <div className="w-20 sm:w-32 text-right">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">
                      ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <button
                    onClick={() => openAlertModal(coin)}
                    title="Set price alert"
                    className={`w-7 h-7 flex items-center justify-center rounded-full transition
                      ${alerts.some((a) => a.symbol === coin.symbol)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-cyan-500 hover:text-white'}`}
                  >
                    <BellIcon active={alerts.some((a) => a.symbol === coin.symbol)} />
                  </button>

                  <button
                    onClick={() => handleRemoveCoin(coin.symbol)}
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

      {/* Price Alert Modal */}
      {alertModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAlertModal(null); }}
        >
          <div className="w-full max-w-md rounded-xl shadow-2xl p-6 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Price Alerts — {alertModal.name}
              </h2>
              <button
                onClick={() => setAlertModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Existing alerts for this coin */}
            {alerts.filter((a) => a.symbol === alertModal.symbol).length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Active alerts
                </p>
                {alerts
                  .filter((a) => a.symbol === alertModal.symbol)
                  .map((a) => (
                    <div
                      key={String(a._id)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                    >
                      <span className="text-sm text-gray-800 dark:text-white">
                        {a.direction === 'above' ? '↑ Above' : '↓ Below'}{' '}
                        <strong>${a.targetPrice.toLocaleString()}</strong>
                      </span>
                      <button
                        onClick={() => deleteAlert(a._id)}
                        className="text-gray-400 hover:text-red-500 text-xs font-bold transition"
                        title="Delete alert"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* New alert form */}
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              New alert
            </p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setAlertDirection('above')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border
                  ${alertDirection === 'above'
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
              >
                ↑ Above
              </button>
              <button
                onClick={() => setAlertDirection('below')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border
                  ${alertDirection === 'below'
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
              >
                ↓ Below
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Target price in USD"
                value={alertPrice}
                onChange={(e) => { setAlertPrice(e.target.value); setAlertError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && createAlert()}
                className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm transition
                  bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-white placeholder-gray-400
                  focus:border-cyan-500 dark:focus:border-cyan-400"
              />
              <button
                onClick={createAlert}
                disabled={alertSaving}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {alertSaving ? '...' : 'Set'}
              </button>
            </div>

            {alertError && (
              <p className="mt-2 text-xs text-red-400">{alertError}</p>
            )}
          </div>
        </div>
      )}

      {/* Add Coin Modal */}
      {showModal && (
        <AddCoinModal
          coins={coins}
          onAdd={addCoin}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
