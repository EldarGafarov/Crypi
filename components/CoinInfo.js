/**
 * CoinInfo Component
 * Displays details of a cryptocurrency including its name, symbol, and description.
 */
import React, { useState, useEffect } from 'react';

const CoinInfo = ({ symbol }) => {
  const [coinDetails, setCoinDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      const fetchCoinDetails = async () => {
        try {
          const res = await fetch(`/api/coin-details/${symbol}`);
          const data = await res.json();
          if (res.ok) {
            setCoinDetails(data);
          } else {
            setError(data.error || 'Error fetching coin details');
          }
        } catch (err) {
          setError('Error fetching coin details');
        }
      };
      fetchCoinDetails();
    }
  }, [symbol]);
//
  return (
    <div className="text-center">
      {coinDetails ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{coinDetails.name}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {coinDetails.symbol?.toUpperCase()}
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {coinDetails.description || 'Description not available'}
          </p>
        </>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">Loading coin info...</p>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default CoinInfo;
