import { useState, useEffect, useRef } from 'react';

// ── Number formatters ────────────────────────────────────────────────────────

const formatPrice = (n) => {
  if (n == null) return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  if (num >= 1000) return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 1)    return `$${num.toFixed(4)}`;
  return `$${num.toFixed(8)}`;
};

const formatLarge = (n) => {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

const formatSupply = (n) => {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

// ── Tooltip "i" icon ─────────────────────────────────────────────────────────
// Hovering the icon shows a small bubble with a plain-English explanation.
// Uses CSS group-hover — no JavaScript state needed.

const InfoTooltip = ({ text }) => (
  <span className="relative group cursor-pointer inline-flex items-center">
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300/40 dark:bg-gray-600/60 text-gray-500 dark:text-gray-400 text-[9px] font-bold leading-none hover:bg-cyan-500/30 hover:text-cyan-400 transition select-none">
      i
    </span>
    {/* Tooltip bubble — hidden by default, shown on hover */}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-20 text-center shadow-xl leading-snug">
      {text}
    </span>
  </span>
);

// ── Stat tile ─────────────────────────────────────────────────────────────────

const Stat = ({ label, value, sub, positive, negative, live, tooltip }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
      {label}
      {live && <span className="text-green-500 animate-pulse text-xs">●</span>}
      {tooltip && <InfoTooltip text={tooltip} />}
    </p>
    <p className={`text-sm font-semibold
      ${positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-gray-800 dark:text-white'}`}>
      {value}
    </p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const CoinInfo = ({ symbol }) => {
  const [info, setInfo]     = useState(null);  // static data from /api/coin-info
  const [ticker, setTicker] = useState(null);  // live data from @ticker WebSocket
  const [error, setError]   = useState(null);
  const wsRef = useRef(null);

  // One-time fetch: name, image, market cap, rank, ATH, supply
  useEffect(() => {
    if (!symbol) return;
    setInfo(null);
    setError(null);

    fetch(`/api/coin-info/${symbol}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInfo(data);
      })
      .catch(() => setError('Failed to load coin data'));
  }, [symbol]);

  // Live WebSocket: Binance @ticker — updates every second
  // Provides: current price (c), 24h change % (P), 24h high (h), low (l), volume (q)
  useEffect(() => {
    if (!symbol) return;
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
    wsRef.current = ws;

    ws.onmessage = ({ data }) => setTicker(JSON.parse(data));
    ws.onerror   = () => {};  // ticker is a bonus — silently ignore errors

    return () => ws.close();
  }, [symbol]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!info && !ticker) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-400 text-sm animate-pulse">Loading coin data...</p>
      </div>
    );
  }

  const base       = symbol?.replace(/USDT$/i, '') || '';
  const changePos  = ticker ? parseFloat(ticker.P) >= 0 : null;
  const fromAthPos = info   ? parseFloat(info.ath_change_percentage) >= 0 : null;

  return (
    <div>

      {/* ── Header: image · name · rank · live price ── */}
      <div className="flex flex-wrap items-center gap-4 mb-6">

        {info?.image && (
          <img
            src={info.image}
            alt={info.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {info?.name || base}
            </h2>
            <span className="text-sm text-gray-400">{base}</span>
            {info?.market_cap_rank && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                #{info.market_cap_rank}
              </span>
            )}
          </div>
          {info?.market_cap && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Market Cap:{' '}
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                {formatLarge(info.market_cap)}
              </span>
            </p>
          )}
        </div>

        {/* Live price + 24h % change — pushed to the right */}
        {ticker && (
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {formatPrice(ticker.c)}
            </p>
            <p className={`text-sm font-medium ${changePos ? 'text-green-400' : 'text-red-400'}`}>
              {changePos ? '+' : ''}{parseFloat(ticker.P).toFixed(2)}%
              <span className="text-gray-400 font-normal ml-1">24h</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">

        <Stat
          label="Current Price"
          value={ticker ? formatPrice(ticker.c) : '—'}
          live
          tooltip="The latest price this coin was traded at on Binance"
        />
        <Stat
          label="24h Change"
          value={ticker ? `${changePos ? '+' : ''}${parseFloat(ticker.P).toFixed(2)}%` : '—'}
          positive={changePos === true}
          negative={changePos === false}
          live
          tooltip="How much the price moved up or down over the last 24 hours"
        />
        <Stat
          label="24h High"
          value={ticker ? formatPrice(ticker.h) : '—'}
          live
          tooltip="The highest price this coin reached in the last 24 hours"
        />
        <Stat
          label="24h Low"
          value={ticker ? formatPrice(ticker.l) : '—'}
          live
          tooltip="The lowest price this coin dropped to in the last 24 hours"
        />
        <Stat
          label="24h Volume"
          value={ticker ? formatLarge(parseFloat(ticker.q)) : '—'}
          live
          tooltip="Total USD value of all trades made in the last 24 hours"
        />
        <Stat
          label="All-Time High"
          value={info ? formatPrice(info.ath) : '—'}
          tooltip="The highest price this coin has ever reached"
        />
        <Stat
          label="From ATH"
          value={info ? `${parseFloat(info.ath_change_percentage).toFixed(1)}%` : '—'}
          positive={fromAthPos === true}
          negative={fromAthPos === false}
          tooltip="How far the current price is below the all-time high. 0% means it's at ATH right now."
        />
        <Stat
          label="Circulating Supply"
          value={info ? formatSupply(info.circulating_supply) : '—'}
          sub={info?.total_supply ? `of ${formatSupply(info.total_supply)} total` : undefined}
          tooltip="How many coins currently exist and are in circulation"
        />
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default CoinInfo;
