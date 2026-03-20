import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useTheme } from '@/context/ThemeContext';

// Range config: Binance interval/limit and whether to open a WebSocket
const RANGES = {
  live: { interval: '1m',  limit: 20,  live: true  },
  '1d': { interval: '15m', limit: 96,  live: false },
  '1m': { interval: '1h',  limit: 744, live: false },
  '1y': { interval: '1d',  limit: 365, live: false },
  '5y': { interval: '3d',  limit: 609, live: false },
};

const RECONNECT_DELAY = 3000;
const MAX_SMA_LINES   = 5;

// Parse Binance REST kline array into TradingView format ({ time Unix s, open, high, low, close, volume })
const parseTvKline = (d) => ({
  time:   Math.floor(d[0] / 1000),
  open:   parseFloat(d[1]),
  high:   parseFloat(d[2]),
  low:    parseFloat(d[3]),
  close:  parseFloat(d[4]),
  volume: parseFloat(d[5]),
});

// Parse Binance WebSocket kline into TradingView format
const parseTvWsKline = (k) => ({
  time:   Math.floor(k.t / 1000),
  open:   parseFloat(k.o),
  high:   parseFloat(k.h),
  low:    parseFloat(k.l),
  close:  parseFloat(k.c),
  volume: parseFloat(k.v),
});

// SMA in TradingView { time, value } format — null skipped for first period-1 candles
const computeTvSMA = (candles, period) =>
  candles
    .map((c, i) => {
      if (i < period - 1) return null;
      const sum = candles.slice(i - period + 1, i + 1).reduce((s, x) => s + x.close, 0);
      return { time: c.time, value: sum / period };
    })
    .filter(Boolean);

// Chart layout/colours for dark and light mode
const themeOptions = (dark) => ({
  layout: {
    background: { type: ColorType.Solid, color: dark ? '#111827' : '#ffffff' },
    textColor: dark ? '#9ca3af' : '#374151',
  },
  grid: {
    vertLines: { color: dark ? '#1f2937' : '#f3f4f6' },
    horzLines: { color: dark ? '#1f2937' : '#f3f4f6' },
  },
  rightPriceScale: { borderColor: dark ? '#374151' : '#d1d5db' },
  timeScale: { borderColor: dark ? '#374151' : '#d1d5db', timeVisible: true, secondsVisible: false, fixLeftEdge: true },
});

const PriceChart = ({ symbol }) => {
  const [range, setRange]             = useState('1d');
  const [tvCandles, setTvCandles]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [pctChange, setPctChange]     = useState(null);
  const [liveCandle, setLiveCandle]   = useState(null);

  // Customisable SMA lines: each entry is { id, period, color }
  const [smaLines, setSmaLines] = useState([
    { id: 1, period: 7,  color: '#F59E0B' },
    { id: 2, period: 25, color: '#3B82F6' },
  ]);
  const nextId = useRef(3);

  // Cache TV candles so range switches don't re-fetch
  const tvCache = useRef({});

  // TradingView chart refs (imperative canvas API)
  const containerRef    = useRef(null);
  const chartRef        = useRef(null);
  const candleRef       = useRef(null);
  const volRef          = useRef(null);
  const smaMapRef       = useRef({});   // { lineId: { series, period } }
  const prevCandlesRef  = useRef([]);   // detect when tvCandles actually changes vs just smaLines
  const rollingRef      = useRef([]);   // rolling candle window kept in sync for live SMA updates

  const { isDarkMode } = useTheme();

  // ── Init chart on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 420,
      ...themeOptions(isDarkMode),
    });
    chartRef.current = chart;

    // Candlestick series
    candleRef.current = chart.addCandlestickSeries({
      upColor:         '#22c55e',
      downColor:       '#ef4444',
      borderUpColor:   '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor:     '#22c55e',
      wickDownColor:   '#ef4444',
    });

    // Candlesticks occupy the top 75% — auto-scales to visible candles as you scroll
    chart.priceScale('right').applyOptions({
      autoScale:    true,
      scaleMargins: { top: 0.05, bottom: 0.25 },
    });

    // Volume histogram in the bottom 25%, on a separate scale so it never overlaps
    volRef.current = chart.addHistogramSeries({
      priceFormat:  { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    // Responsive width
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current  = null;
      candleRef.current = null;
      volRef.current    = null;
      smaMapRef.current = {};
    };
  }, []); // mount once

  // Theme changes
  useEffect(() => {
    chartRef.current?.applyOptions(themeOptions(isDarkMode));
  }, [isDarkMode]);

  // Live range: allow the right edge to advance as new candles arrive via WebSocket.
  // Historical ranges: lock the right edge so the user can't scroll into empty space.
  useEffect(() => {
    chartRef.current?.applyOptions({ timeScale: { fixRightEdge: range !== 'live' } });
  }, [range]);

  // Load candle + volume data into chart
  useEffect(() => {
    if (!candleRef.current || !tvCandles.length) return;
    rollingRef.current = [...tvCandles];   // seed rolling window for live SMA updates
    candleRef.current.setData(tvCandles);
    volRef.current.setData(
      tvCandles.map((c) => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
      }))
    );
    chartRef.current.timeScale().fitContent();
  }, [tvCandles]);

  // Sync SMA lines whenever config or candle data changes.
  // setData is skipped when only color changed (color picker fires on every drag pixel).
  useEffect(() => {
    if (!chartRef.current || !tvCandles.length) return;

    const candlesChanged = tvCandles !== prevCandlesRef.current;
    prevCandlesRef.current = tvCandles;

    const currentIds = new Set(smaLines.map((l) => l.id));

    // Remove deleted lines
    Object.keys(smaMapRef.current).forEach((id) => {
      if (!currentIds.has(Number(id))) {
        chartRef.current.removeSeries(smaMapRef.current[id].series);
        delete smaMapRef.current[id];
      }
    });

    // Add new or update existing lines
    smaLines.forEach(({ id, period, color }) => {
      if (!smaMapRef.current[id]) {
        // New series — create and populate
        const series = chartRef.current.addLineSeries({
          color,
          lineWidth:              1.5,
          priceLineVisible:       false,
          lastValueVisible:       false,
          crosshairMarkerVisible: false,
          title: `SMA ${period}`,
        });
        smaMapRef.current[id] = { series, period };
        series.setData(computeTvSMA(tvCandles, period));
      } else {
        const entry = smaMapRef.current[id];
        // Color/title update is always cheap
        entry.series.applyOptions({ color, title: `SMA ${period}` });
        // Only recompute data when candles changed or period was edited
        if (candlesChanged || entry.period !== period) {
          entry.period = period;
          entry.series.setData(computeTvSMA(tvCandles, period));
        }
      }
    });
  }, [smaLines, tvCandles]);

  // Live candle + volume + SMA updates (WS)
  useEffect(() => {
    if (!liveCandle || !candleRef.current) return;

    candleRef.current.update(liveCandle);
    volRef.current.update({
      time:  liveCandle.time,
      value: liveCandle.volume,
      color: liveCandle.close >= liveCandle.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
    });

    // Keep rolling window in sync: update last candle (same minute) or append (new minute)
    const rolling = rollingRef.current;
    if (rolling.length > 0 && rolling[rolling.length - 1].time === liveCandle.time) {
      rolling[rolling.length - 1] = liveCandle;
    } else {
      rolling.push(liveCandle);
    }

    // Push updated SMA value for each line
    Object.values(smaMapRef.current).forEach(({ series, period }) => {
      if (rolling.length < period) return;
      const value = rolling.slice(-period).reduce((s, c) => s + c.close, 0) / period;
      series.update({ time: liveCandle.time, value });
    });
  }, [liveCandle]);

  // Fetch candles when symbol/range changes
  useEffect(() => {
    if (!symbol) return;

    let ws             = null;
    let reconnectTimer = null;
    let active         = true;

    const cfg = RANGES[range];
    const key = `${symbol}-${range}`;

    const loadCandles = async () => {
      if (tvCache.current[key]) return tvCache.current[key];
      setLoading(true);
      const res = await fetch(
        `https://api.binance.com/api/v1/klines?symbol=${symbol.toUpperCase()}&interval=${cfg.interval}&limit=${cfg.limit}`
      );
      const tv = (await res.json()).map(parseTvKline);
      tvCache.current[key] = tv;
      return tv;
    };

    const connectWs = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);
      ws.onmessage = ({ data }) => {
        setLiveCandle(parseTvWsKline(JSON.parse(data).k));
        setError(null);
      };
      ws.onerror = () => setError('Connection error — retrying...');
      ws.onclose = () => {
        if (active) reconnectTimer = setTimeout(connectWs, RECONNECT_DELAY);
      };
    };

    loadCandles()
      .then((tv) => {
        if (!active) return;
        setTvCandles(tv);
        setLoading(false);

        // Price change summary for the selected period
        const first  = tv[0].close;
        const last   = tv[tv.length - 1].close;
        const change = (last - first).toFixed(2);
        setPriceChange(change);
        setPctChange(((change / first) * 100).toFixed(2));

        if (cfg.live) connectWs();
      })
      .catch(() => {
        if (active) { setError('Failed to load data'); setLoading(false); }
      });

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [symbol, range]);

  //  SMA controls 
  const addSmaLine = () => {
    if (smaLines.length >= MAX_SMA_LINES) return;
    setSmaLines((prev) => [...prev, { id: nextId.current++, period: 50, color: '#22C55E' }]);
  };

  const removeSmaLine = (id) =>
    setSmaLines((prev) => prev.filter((l) => l.id !== id));

  const updateSmaPeriod = (id, raw) => {
    const period = parseInt(raw, 10);
    if (!period || period < 1) return;
    setSmaLines((prev) => prev.map((l) => l.id === id ? { ...l, period } : l));
  };

  const updateSmaColor = (id, color) =>
    setSmaLines((prev) => prev.map((l) => l.id === id ? { ...l, color } : l));

  const isUp = Number(priceChange) >= 0;

  return (
    <div className="w-full flex flex-col">

      {/* Controls */}
      <div className="flex flex-col items-center mb-4 gap-2">

        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Price Chart
          {range === 'live' && (
            <span className="ml-2 text-xs font-normal text-green-500 animate-pulse">● Live</span>
          )}
        </h3>

        {/* Time range buttons + Fit */}
        <div className="flex gap-2 items-center">
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
          <span className="text-gray-300 dark:text-gray-600 select-none">|</span>
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            title="Reset zoom to fit all candles"
            className="px-3 py-1 text-sm font-medium rounded-lg transition-colors
              bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Fit
          </button>
        </div>

        {/* SMA line chips — colour picker dot, period input, remove button */}
        <div className="flex flex-wrap items-center gap-2">
          {smaLines.map((line) => (
            <div
              key={line.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs
                bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {/* Colour dot — clicking opens native colour picker */}
              <label className="relative flex items-center cursor-pointer" title="Change colour">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                <input
                  type="color"
                  value={line.color}
                  onChange={(e) => updateSmaColor(line.id, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>

              {/* Period input — applies on blur or Enter */}
              <span className="text-gray-500 dark:text-gray-400">SMA</span>
              <input
                type="number"
                min="1"
                defaultValue={line.period}
                onBlur={(e) => updateSmaPeriod(line.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateSmaPeriod(line.id, e.target.value)}
                className="w-10 bg-transparent text-center outline-none border-b border-gray-400 dark:border-gray-500
                  focus:border-blue-500 text-xs text-gray-700 dark:text-gray-200"
              />

              <button
                onClick={() => removeSmaLine(line.id)}
                className="text-gray-400 hover:text-red-500 transition font-bold leading-none ml-0.5"
                title="Remove"
              >✕</button>
            </div>
          ))}

          {smaLines.length < MAX_SMA_LINES && (
            <button
              onClick={addSmaLine}
              className="px-2 py-1 rounded-lg text-xs font-medium transition
                bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400
                hover:bg-gray-200 dark:hover:bg-gray-600"
            >+ SMA</button>
          )}
        </div>

        {/* Price change summary */}
        {loading && <p className="text-xs text-gray-400">Loading...</p>}
        {!loading && priceChange !== null && (
          <p className={`text-sm font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '+' : ''}{priceChange} ({pctChange}%)
            <span className="text-gray-400 font-normal ml-1">past {range}</span>
          </p>
        )}
      </div>

      {/* Chart canvas */}
      <div ref={containerRef} className="w-full" />

      {error && <p className="text-amber-500 text-sm text-center mt-2">{error}</p>}
    </div>
  );
};

// React.memo prevents re-renders when the parent re-renders (e.g. dark mode toggle)
export default React.memo(PriceChart);
