import { useState, useEffect, useRef } from 'react';
import CoinIcon from './CoinIcon';

// Reusable "Add Coin" modal with debounced search.
// Props:
//   coins   — current coin list (to detect already-added coins)
//   onAdd   — called with the coin object when user clicks Add
//   onClose — called to dismiss the modal
export default function AddCoinModal({ coins, onAdd, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  // Debounced search: fires 300ms after the user stops typing.
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/coins/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.coins || []);
      setSearching(false);
    }, 300);
  }, [searchQuery]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl shadow-2xl p-6 bg-white dark:bg-gray-800">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Coin</h2>
          <button
            onClick={onClose}
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
          className="w-full px-4 py-2 rounded-lg border mb-4 outline-none text-sm transition
            bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white placeholder-gray-400
            focus:border-cyan-500 dark:focus:border-cyan-400"
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
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <CoinIcon coin={coin} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{coin.name}</p>
                    <p className="text-xs text-gray-400">{coin.symbol}</p>
                  </div>
                  <button
                    disabled={alreadyAdded}
                    onClick={() => { onAdd(coin); onClose(); }}
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
  );
}
