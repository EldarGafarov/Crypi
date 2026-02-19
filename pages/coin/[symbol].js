import React from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../../context/ThemeContext';
import CoinInfo   from '../../components/CoinInfo';
import LivePrice  from '../../components/LivePrice';
import PriceChart from '../../components/PriceChart';

const CoinDetail = () => {
  const { symbol }    = useRouter().query;
  const { isDarkMode } = useTheme();

  const card = `p-6 rounded-xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white/10 backdrop-blur-lg'}`;

  return (
    <div className={`min-h-screen w-full px-4 md:px-6 py-8 transition-colors duration-200
      ${isDarkMode ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black' : 'bg-white'}`}>

      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top row: coin info + live price side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${card} h-fit`}><CoinInfo  symbol={symbol} /></div>
          <div className={`${card} h-fit`}><LivePrice symbol={symbol} /></div>
        </div>

        {/* Unified chart: live ↔ historical, one component */}
        <div className={`${card}`}>
          <PriceChart symbol={symbol} />
        </div>

      </div>
    </div>
  );
};

export default CoinDetail;
