/**
 * CoinCard Component
 * Displays a cryptocurrency card with its image, name, price, and a link to details.
 * When onRemove is provided (logged-in users), shows an X button to remove the coin.
 **/
import Link from 'next/link';
import { useState } from 'react';

const CoinCard = ({ coin, price, onRemove }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative bg-gradient-to-br from-cyan-500 to-blue-500 dark:from-blue-600 dark:to-blue-800 text-white p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center justify-center">
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(coin.symbol); }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 text-white text-xs font-bold transition"
          title="Remove coin"
        >
          ✕
        </button>
      )}
      {imgFailed ? (
        <div className="w-16 h-16 rounded-full border-2 border-white mb-4 bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{coin.name.slice(0, 4)}</span>
        </div>
      ) : (
        <img
          src={coin.image}
          alt={coin.name}
          className="w-16 h-16 object-cover rounded-full border-2 border-white mb-4"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="text-center">
        <h2 className="text-lg font-bold truncate">{coin.name}</h2>
        <p className="text-xl font-semibold mt-2">
          {price ? `$${price.toFixed(2)}` : 'Loading...'}
        </p>
        <Link href={`/coin/${coin.symbol}`}>
          <div className="mt-4 text-sm font-medium text-white underline hover:text-gray-200 cursor-pointer">
            View Details
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CoinCard;
