/**
 * HistoricalData Component
 * Displays historical price data for a cryptocurrency as a bar chart with time range selection.
 */
import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
} from 'recharts';

const HistoricalData = ({ symbol, timeRange, setTimeRange, timeRangeOptions }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [error, setError] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [percentageChange, setPercentageChange] = useState(null);
  const [loadingChange, setLoadingChange] = useState(false);

 //Fetches historical price data for a given cryptocurrency symbol and time range.
 //Updates state with formatted data, price change, and percentage change.
  useEffect(() => {
    if (symbol) {
      const fetchHistoricalData = async () => {
        try {
          const intervalMap = { '5y': '3d', '1y': '1d', '1m': '1h', '1d': '15m' };
          const limitMap = { '5y': 609, '1y': 365, '1m': 744, '1d': 96 };

          const interval = intervalMap[timeRange] || '1d';
          const limit = limitMap[timeRange] || 96;

          const res = await fetch(
            `https://api.binance.com/api/v1/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
          );
          const data = await res.json();

          if (res.ok) {
            const formattedData = data.map((d) => {
              const date = new Date(d[0]);
              const formatOptions =
                timeRange === '1d'
                  ? { hour: '2-digit', minute: '2-digit' }
                  : timeRange === '1m'
                  ? { month: 'short', day: 'numeric' }
                  : { year: 'numeric', month: 'short' };
              return {
                time: date.toLocaleDateString([], formatOptions),
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
              };
            });

            setHistoricalData(formattedData);

            // Calculate price change and percentage change
            if (formattedData.length > 0) {
              const firstClose = formattedData[0].close;
              const lastClose = formattedData[formattedData.length - 1].close;
              const change = lastClose - firstClose;
              const percentage = ((change / firstClose) * 100).toFixed(2);

              setPriceChange(change.toFixed(2));
              setPercentageChange(percentage);
            }
          } else {
            setError('Error fetching historical data');
          }
        } catch (err) {
          setError('Error fetching historical data');
        }
      };

      fetchHistoricalData();
    }
  }, [symbol, timeRange]);

  return (
    <>
      {/* Price Change Display */}
      <div className="text-center mb-4">
        {loadingChange ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          priceChange !== null && percentageChange !== null && (
            <p
              className={`text-lg font-semibold ${
                priceChange >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              }`}
            >
              {priceChange >= 0 ? '+' : ''}
              {priceChange} ({percentageChange}%){' '}
              <span className="text-gray-600 dark:text-gray-400">Past {timeRange}</span>
            </p>
          )
        )}
      </div>

      {/* Historical Data Header */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
        Historical Data ({timeRange})
      </h3>


      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={historicalData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              border: '1px solid #334155',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              color: '#F1F5F9',
            }}
            labelStyle={{
              color: '#94A3B8',
              fontWeight: 'bold',
            }}
          />
          <Bar
            dataKey="close"
            fill="#8884d8"
            barSize={20}
            shape={(props) => {
              const { x, y, width, height, payload } = props;
              const color = payload.close > payload.open ? '#4CAF50' : '#F44336'; // Green or Red
              return <rect x={x} y={y} width={width} height={height} fill={color} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Time Range Selector */}
      <div className="flex justify-center mt-4">
        {timeRangeOptions.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`mx-2 px-4 py-2 text-sm font-medium ${
              timeRange === range ? 'text-white bg-blue-600' : 'text-blue-600 bg-white'
            } rounded-lg shadow-lg`}
          >
            {range}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </>
  );
};

export default HistoricalData;
