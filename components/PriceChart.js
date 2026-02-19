import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer, ComposedChart, BarChart,
  XAxis, YAxis, Tooltip, CartesianGrid, Bar, Line,
} from 'recharts';

// Range config: interval/limit sent to Binance REST, and whether to open a WebSocket
const RANGES = {
  live: { interval: '1m',  limit: 20,  live: true  },
  '1d': { interval: '15m', limit: 96,  live: false },
  '1m': { interval: '1h',  limit: 744, live: false },
  '1y': { interval: '1d',  limit: 365, live: false },
  '5y': { interval: '3d',  limit: 609, live: false },
};

const RECONNECT_DELAY = 3000;

const formatTime = (ts, range) => {
  const d = new Date(ts);
  if (range === 'live' || range === '1d')
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (range === '1m')
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { year: 'numeric', month: 'short' });
};

// Parse a Binance REST kline array into a chart-ready candle
const parseKline = (d, range) => {
  const open  = parseFloat(d[1]);
  const close = parseFloat(d[4]);
  const up    = close >= open;
  return {
    time:   formatTime(d[0], range),
    close,                                          // kept for SMA calculation
    wick:   [parseFloat(d[3]), parseFloat(d[2])],  // [low, high] → range bar
    body:   [Math.min(open, close), Math.max(open, close)],
    volume: parseFloat(d[5]),
    color:  up ? '#4CAF50' : '#F44336',
  };
};

// Parse a Binance WebSocket kline object (live updates)
const parseWsKline = (k) => {
  const open  = parseFloat(k.o);
  const close = parseFloat(k.c);
  const up    = close >= open;
  return {
    time:   new Date(k.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    close,
    wick:   [parseFloat(k.l), parseFloat(k.h)],
    body:   [Math.min(open, close), Math.max(open, close)],
    volume: parseFloat(k.v),
    color:  up ? '#4CAF50' : '#F44336',
  };
};

// SMA: average of the last `period` closing prices. null until enough data exists.
const computeSMA = (candles, period) =>
  candles.map((_, i) => {
    if (i < period - 1) return null;
    const sum = candles.slice(i - period + 1, i + 1).reduce((s, c) => s + c.close, 0);
    return sum / period;
  });

// Tooltip — white in light mode, dark in dark mode
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-xs text-black dark:text-white shadow">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => {
        if (entry.value == null) return null;
        const val = Array.isArray(entry.value)
          ? entry.value.map((n) => n.toFixed(2)).join(' – ')
          : entry.value.toFixed(2);
        return (
          <p key={i} style={{ color: entry.color || 'inherit' }}>
            {entry.name}: {val}
          </p>
        );
      })}
    </div>
  );
};

// SVG bar shapes — receive all data-entry fields as props (including `color`)
const WickShape = ({ x, y, width, height, color }) => (
  <rect x={x + width / 2 - 1} y={y} width={2} height={height} fill={color} />
);
const BodyShape = ({ x, y, width, height, color }) => (
  <rect x={x} y={y} width={width} height={height} fill={color} />
);
const VolShape = ({ x, y, width, height, color }) => (
  <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.6} />
);

const PriceChart = ({ symbol }) => {
  const [range, setRange]         = useState('1d');
  const [candles, setCandles]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [pctChange, setPctChange]     = useState(null);

  const cache = useRef({});  // { "BTCUSDT-1d": [...] } — avoids re-fetching on range switch

  useEffect(() => {
    if (!symbol) return;

    let ws             = null;
    let reconnectTimer = null;
    let active         = true;

    const cfg = RANGES[range];
    const key = `${symbol}-${range}`;

    // Step 1: load candles (from cache or REST)
    const loadCandles = async () => {
      if (cache.current[key]) return cache.current[key];

      setLoading(true);
      const res  = await fetch(
        `https://api.binance.com/api/v1/klines?symbol=${symbol.toUpperCase()}&interval=${cfg.interval}&limit=${cfg.limit}`
      );
      const raw  = await res.json();
      const data = raw.map((d) => parseKline(d, range));

      // Attach SMA lines to every candle
      const sma7  = computeSMA(data, 7);
      const sma25 = computeSMA(data, 25);
      data.forEach((c, i) => { c.sma7 = sma7[i]; c.sma25 = sma25[i]; });

      cache.current[key] = data;
      return data;
    };

    //Step 2: open WebSocket for live range only
    const connectWs = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);

      ws.onmessage = ({ data }) => {
        const candle = parseWsKline(JSON.parse(data).k);
        setCandles((prev) => {
          // Same minute → update last candle in-place
          if (prev.length && prev[prev.length - 1].time === candle.time) {
            return [...prev.slice(0, -1), candle];
          }
          // New minute → append, cap at 20
          const next = [...prev, candle].slice(-20);
          // Recompute SMAs with the new candle included
          const sma7  = computeSMA(next, 7);
          const sma25 = computeSMA(next, 25);
          return next.map((c, i) => ({ ...c, sma7: sma7[i], sma25: sma25[i] }));
        });
        setError(null);
      };

      ws.onerror = () => setError('Connection error — retrying...');
      ws.onclose = () => {
        if (active) reconnectTimer = setTimeout(connectWs, RECONNECT_DELAY);
      };
    };

    //Boot sequence
    loadCandles()
      .then((data) => {
        if (!active) return;
        setCandles(data);
        setLoading(false);

        // Price change summary
        const first  = data[0].close;
        const last   = data[data.length - 1].close;
        const change = (last - first).toFixed(2);
        setPriceChange(change);
        setPctChange(((change / first) * 100).toFixed(2));

        // Only open WebSocket on the live range
        if (cfg.live) connectWs();
      })
      .catch(() => {
        if (active) {
          setError('Failed to load data');
          setLoading(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      ws?.close();  // disconnect WebSocket when switching range or unmounting
    };
  }, [symbol, range]);

  const isUp = Number(priceChange) >= 0;

  return (
    <div className="w-full flex flex-col">

      {/*Header: title → buttons → price change, all centered*/}
      <div className="flex flex-col items-center mb-4 gap-2">

        {/* 1. Title */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Price Chart
          {range === 'live' && (
            <span className="ml-2 text-xs font-normal text-green-500 animate-pulse">● Live</span>
          )}
        </h3>

        {/* 2. Time range buttons */}
        <div className="flex gap-2">
          {Object.keys(RANGES).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                range === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {r === 'live' ? '⚡ Live' : r}
            </button>
          ))}
        </div>

        {/* 3. Price change for the selected period */}
        {loading && <p className="text-xs text-gray-400">Loading...</p>}
        {!loading && priceChange !== null && (
          <p className={`text-sm font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '+' : ''}{priceChange} ({pctChange}%)
            <span className="text-gray-400 font-normal ml-1">past {range}</span>
          </p>
        )}

      </div>

      {/*SMA legend — hidden on live view*/}
      {range !== 'live' && (
        <div className="flex gap-4 mb-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-amber-400" /> SMA 7
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-blue-500" /> SMA 25
          </span>
        </div>
      )}

      {/*Candlestick + SMA chart*/}
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={candles} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />

          {/* Candlestick */}
          <Bar dataKey="wick" barSize={1} shape={<WickShape />} isAnimationActive={false} />
          <Bar dataKey="body" barSize={6} shape={<BodyShape />} isAnimationActive={false} />

          {/* Moving averages — only on historical ranges, not live */}
          {range !== 'live' && <>
            <Line type="monotone" dataKey="sma7"  name="SMA 7"  stroke="#F59E0B"
              strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="sma25" name="SMA 25" stroke="#3B82F6"
              strokeWidth={1.5} dot={false} connectNulls={false} />
          </>}
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Volume chart ── */}
      <p className="text-xs text-gray-400 text-center mt-2">Volume</p>
      <ResponsiveContainer width="100%" height={70}>
        <BarChart data={candles} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <XAxis dataKey="time" hide />
          <YAxis tick={{ fontSize: 10 }} width={70} />
          <Bar dataKey="volume" shape={<VolShape />} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      {error && <p className="text-amber-500 text-sm text-center mt-2">{error}</p>}
    </div>
  );
};

// React.memo prevents re-renders when the parent re-renders (e.g. dark mode toggle).
// PriceChart only needs to re-render when `symbol` actually changes.
export default React.memo(PriceChart);
