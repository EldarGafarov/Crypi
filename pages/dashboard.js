import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import CoinCard from '../components/CoinCard'; // Import the CoinCard component

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

const Dashboard = () => {
  const [prices, setPrices] = useState({});
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Construct the combined stream URL
    const streams = COINS.map((coin) => `${coin.symbol.toLowerCase()}@trade`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const symbol = data.data.s;
      const price = parseFloat(data.data.p);

      // Update the price state for the specific coin,Its the "Old" Prices
      setPrices((prevPrices) => ({
        ...prevPrices,
        [symbol]: price,
      }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, []);

  //Optional Create Dashboard component that generates coin card
  return (
    <div className="min-h-screen flex flex-col justify-start items-center bg-white dark:bg-gray-900 transition-colors duration-200 px-4 pt-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-screen-lg w-full">
        {COINS.map((coin) => (
          <CoinCard key={coin.symbol} coin={coin} price={prices[coin.symbol]} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
