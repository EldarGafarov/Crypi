import React from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../../context/ThemeContext';
import CoinInfo   from '../../components/CoinInfo';
import PriceChart from '../../components/PriceChart';

const CoinDetail = () => {
  const { symbol }     = useRouter().query;
  const { isDarkMode } = useTheme();

  const card = `p-6 rounded-xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white/10 backdrop-blur-lg'}`;

  return (
    <div className={`min-h-screen w-full px-4 md:px-6 py-8 transition-colors duration-200
      ${isDarkMode ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black' : 'bg-white'}`}>

      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Full-width coin info: name, rank, live price, 24h stats, ATH, supply */}
        <div className={card}>
          <CoinInfo symbol={symbol} />
        </div>

        {/* Price chart: live ↔ historical */}
        <div className={card}>
          <PriceChart symbol={symbol} />
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
