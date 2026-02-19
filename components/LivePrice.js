import React, { useState, useEffect } from 'react';

const LivePrice = ({ symbol }) => {
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure symbol is available before trying to connect
    if (!symbol) return; // Don't do anything until the symbol is ready

    const connectWebSocket = () => {
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log(`Connected to Binance WebSocket for ${symbol}`);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const livePrice = data.p;
        setPrice(livePrice);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Error fetching live price data');
      };
//
      socket.onclose = () => {
        console.log(`Disconnected from Binance WebSocket for ${symbol}`);
      };

      // Cleanup WebSocket connection on component unmount
      return () => socket.close();
    };

    // Introduce a small delay before connecting to the WebSocket
    const delay = 500; // Delay in milliseconds (500ms)
    const timer = setTimeout(() => {
      connectWebSocket(); // Try connecting after the delay
    }, delay);

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [symbol]); // Only re-run when the symbol changes

  return (
    
    <div className="mt-4 flex justify-center items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="text-lg font-semibold text-green-500">
          <p className="text-lg font-semibold text-green-500 flex flex-col items-center justify-center">Live Price</p>
          ${price ? parseFloat(price).toFixed(2) : 'Loading...'}
        </div>
      )}
    </div>
  );
};

export default LivePrice;
