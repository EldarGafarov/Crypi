/**
 * CoinCard Component
 * Displays a cryptocurrency card with its image, name, price, and a link to details.
 **/
import Link from 'next/link';

const CoinCard = ({ coin, price }) => {
  return (
    <div className="bg-gradient-to-br from-cyan-500 to-blue-500 dark:from-blue-600 dark:to-blue-800 text-white p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center justify-center">
      <img
        src={coin.image}
        alt={coin.name}
        className="w-16 h-16 object-cover rounded-full border-2 border-white mb-4"
      />
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
