import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import CoinCard from '@/components/CoinCard';
import AddCoinModal from '@/components/AddCoinModal';
import { useCoinsWithPrices } from '@/hooks/useCoinsWithPrices';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { coins, prices, loading, addCoin, removeCoin } = useCoinsWithPrices(user, authLoading);
  const [showModal, setShowModal] = useState(false);

  if (authLoading || loading) {
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
            onClick={() => setShowModal(true)}
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

      {showModal && (
        <AddCoinModal
          coins={coins}
          onAdd={addCoin}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
