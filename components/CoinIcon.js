import { useState } from 'react';

// Displays a coin image. Falls back to a lettered circle if the image is
// missing or fails to load. Used in both the dashboard modal and wallet page.
const CoinIcon = ({ coin, size = 'sm' }) => {
  const [failed, setFailed] = useState(false);

  const sizeClass = size === 'lg'
    ? 'w-10 h-10 text-sm'
    : 'w-8 h-8 text-xs';

  if (failed || !coin.image) {
    return (
      <div className={`${sizeClass} rounded-full bg-white/20 border border-gray-400/30 flex items-center justify-center flex-shrink-0`}>
        <span className="font-bold text-gray-600 dark:text-gray-300">
          {coin.name.slice(0, 3)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={coin.image}
      alt={coin.name}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      onError={() => setFailed(true)}
    />
  );
};

export default CoinIcon;
