// ─── OHLCV Bar ─────────────────────────────────────────────────────────────────
export interface OHLCVBar {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ─── Replay Configuration ───────────────────────────────────────────────────────
export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type ReplaySpeed = 0.1 | 0.25 | 0.5 | 1 | 2 | 3 | 5 | 10 | 100;

export interface ReplayConfig {
  symbol: string; // e.g. "EURUSD=X", "AAPL", "BTC-USD"
  displaySymbol: string; // e.g. "EURUSD", "AAPL", "BTC/USD"
  timeframe: Timeframe;
  startDate: string; // ISO date e.g. "2024-01-01"
  speed: ReplaySpeed;
  initialCapital: number; // default: 10000
  lotSize: number; // default: 0.10
  defaultSLPips: number; // default: 20
  defaultTPPips: number; // default: 40
  pipValue: number; // $ per pip per lot — forex ~$1, varies by pair
}

// ─── Trade Direction ────────────────────────────────────────────────────────────
export type TradeDirection = "LONG" | "SHORT";

// ─── Open (In-Progress) Position ────────────────────────────────────────────────
export interface OpenPosition {
  id: string;
  direction: TradeDirection;
  entryTime: number; // Unix timestamp
  entryPrice: number;
  lots: number;
  slPrice: number | null; // stop loss price
  tpPrice: number | null; // take profit price
  slPips: number | null;
  tpPips: number | null;
  floatingPnl: number; // updates every bar
}

// ─── Closed (Completed) Trade ────────────────────────────────────────────────────
export interface SimulatedTrade {
  id: string;
  direction: TradeDirection;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  lots: number;
  pnl: number; // $ profit/loss
  pnlPct: number; // % of capital
  exitReason: "manual" | "sl" | "tp";
  durationBars: number;
  durationLabel: string; // e.g. "3h 20m"
}

// ─── Equity Point ───────────────────────────────────────────────────────────────
export interface EquityPoint {
  time: number;
  value: number;
}

// ─── Session Metrics ────────────────────────────────────────────────────────────
export interface SessionMetrics {
  netPnl: number;
  netPnlPct: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  equityCurve: EquityPoint[];
}

// ─── Playback State ─────────────────────────────────────────────────────────────
export type ReplayStatus =
  | "setup"
  | "loading"
  | "select"
  | "ready"
  | "playing"
  | "paused"
  | "ended";

// ─── Known Symbols ──────────────────────────────────────────────────────────────
export interface SymbolOption {
  value: string; // Yahoo Finance symbol e.g. "EURUSD=X"
  label: string; // display name e.g. "EUR/USD"
  category: string; // "Forex" | "Stocks" | "Crypto" | "Commodities"
  pipValue: number; // $ per pip per 0.01 lot
  pipSize: number; // price change per pip e.g. 0.0001 for forex
}

export const SYMBOL_OPTIONS: SymbolOption[] = [
  // ── Forex Majors ─────────────────────────────────────────────────────────────
  {
    value: "EURUSD=X",
    label: "EUR/USD",
    category: "Forex Majors",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "GBPUSD=X",
    label: "GBP/USD",
    category: "Forex Majors",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "USDJPY=X",
    label: "USD/JPY",
    category: "Forex Majors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "USDCHF=X",
    label: "USD/CHF",
    category: "Forex Majors",
    pipValue: 1.12,
    pipSize: 0.0001,
  },
  {
    value: "AUDUSD=X",
    label: "AUD/USD",
    category: "Forex Majors",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "USDCAD=X",
    label: "USD/CAD",
    category: "Forex Majors",
    pipValue: 0.74,
    pipSize: 0.0001,
  },
  {
    value: "NZDUSD=X",
    label: "NZD/USD",
    category: "Forex Majors",
    pipValue: 1.0,
    pipSize: 0.0001,
  },

  // ── Forex Minors (Crosses) ────────────────────────────────────────────────────
  {
    value: "EURGBP=X",
    label: "EUR/GBP",
    category: "Forex Minors",
    pipValue: 1.27,
    pipSize: 0.0001,
  },
  {
    value: "EURJPY=X",
    label: "EUR/JPY",
    category: "Forex Minors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "EURCHF=X",
    label: "EUR/CHF",
    category: "Forex Minors",
    pipValue: 1.12,
    pipSize: 0.0001,
  },
  {
    value: "EURAUD=X",
    label: "EUR/AUD",
    category: "Forex Minors",
    pipValue: 0.65,
    pipSize: 0.0001,
  },
  {
    value: "EURCAD=X",
    label: "EUR/CAD",
    category: "Forex Minors",
    pipValue: 0.74,
    pipSize: 0.0001,
  },
  {
    value: "EURNZD=X",
    label: "EUR/NZD",
    category: "Forex Minors",
    pipValue: 0.6,
    pipSize: 0.0001,
  },
  {
    value: "GBPJPY=X",
    label: "GBP/JPY",
    category: "Forex Minors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "GBPCHF=X",
    label: "GBP/CHF",
    category: "Forex Minors",
    pipValue: 1.12,
    pipSize: 0.0001,
  },
  {
    value: "GBPAUD=X",
    label: "GBP/AUD",
    category: "Forex Minors",
    pipValue: 0.65,
    pipSize: 0.0001,
  },
  {
    value: "GBPCAD=X",
    label: "GBP/CAD",
    category: "Forex Minors",
    pipValue: 0.74,
    pipSize: 0.0001,
  },
  {
    value: "GBPNZD=X",
    label: "GBP/NZD",
    category: "Forex Minors",
    pipValue: 0.6,
    pipSize: 0.0001,
  },
  {
    value: "AUDJPY=X",
    label: "AUD/JPY",
    category: "Forex Minors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "AUDCHF=X",
    label: "AUD/CHF",
    category: "Forex Minors",
    pipValue: 1.12,
    pipSize: 0.0001,
  },
  {
    value: "AUDCAD=X",
    label: "AUD/CAD",
    category: "Forex Minors",
    pipValue: 0.74,
    pipSize: 0.0001,
  },
  {
    value: "AUDNZD=X",
    label: "AUD/NZD",
    category: "Forex Minors",
    pipValue: 0.6,
    pipSize: 0.0001,
  },
  {
    value: "CADJPY=X",
    label: "CAD/JPY",
    category: "Forex Minors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "CHFJPY=X",
    label: "CHF/JPY",
    category: "Forex Minors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "NZDJPY=X",
    label: "NZD/JPY",
    category: "Forex Minors",
    pipValue: 0.91,
    pipSize: 0.01,
  },
  {
    value: "NZDCAD=X",
    label: "NZD/CAD",
    category: "Forex Minors",
    pipValue: 0.74,
    pipSize: 0.0001,
  },
  {
    value: "NZDCHF=X",
    label: "NZD/CHF",
    category: "Forex Minors",
    pipValue: 1.12,
    pipSize: 0.0001,
  },

  // ── Forex Exotics ─────────────────────────────────────────────────────────────
  {
    value: "USDINR=X",
    label: "USD/INR",
    category: "Forex Exotics",
    pipValue: 0.012,
    pipSize: 0.01,
  },
  {
    value: "USDTRY=X",
    label: "USD/TRY",
    category: "Forex Exotics",
    pipValue: 0.031,
    pipSize: 0.0001,
  },
  {
    value: "USDZAR=X",
    label: "USD/ZAR",
    category: "Forex Exotics",
    pipValue: 0.054,
    pipSize: 0.0001,
  },
  {
    value: "USDMXN=X",
    label: "USD/MXN",
    category: "Forex Exotics",
    pipValue: 0.058,
    pipSize: 0.0001,
  },
  {
    value: "USDHKD=X",
    label: "USD/HKD",
    category: "Forex Exotics",
    pipValue: 0.128,
    pipSize: 0.0001,
  },
  {
    value: "USDSGD=X",
    label: "USD/SGD",
    category: "Forex Exotics",
    pipValue: 0.74,
    pipSize: 0.0001,
  },
  {
    value: "USDNOK=X",
    label: "USD/NOK",
    category: "Forex Exotics",
    pipValue: 0.095,
    pipSize: 0.0001,
  },
  {
    value: "USDSEK=X",
    label: "USD/SEK",
    category: "Forex Exotics",
    pipValue: 0.095,
    pipSize: 0.0001,
  },
  {
    value: "USDPLN=X",
    label: "USD/PLN",
    category: "Forex Exotics",
    pipValue: 0.25,
    pipSize: 0.0001,
  },

  // ── Commodities ───────────────────────────────────────────────────────────────
  {
    value: "GC=F",
    label: "Gold (XAU/USD)",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.1,
  },
  {
    value: "SI=F",
    label: "Silver (XAG/USD)",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "CL=F",
    label: "Crude Oil (WTI)",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "BZ=F",
    label: "Brent Crude Oil",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "NG=F",
    label: "Natural Gas",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.001,
  },
  {
    value: "HG=F",
    label: "Copper",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "PL=F",
    label: "Platinum",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.1,
  },
  {
    value: "PA=F",
    label: "Palladium",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.1,
  },
  {
    value: "ZW=F",
    label: "Wheat",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "ZC=F",
    label: "Corn",
    category: "Commodities",
    pipValue: 1.0,
    pipSize: 0.01,
  },

  // ── Crypto ────────────────────────────────────────────────────────────────────
  {
    value: "BTC-USD",
    label: "Bitcoin (BTC)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 1.0,
  },
  {
    value: "ETH-USD",
    label: "Ethereum (ETH)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "SOL-USD",
    label: "Solana (SOL)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "BNB-USD",
    label: "BNB",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "XRP-USD",
    label: "XRP (Ripple)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "ADA-USD",
    label: "Cardano (ADA)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "DOGE-USD",
    label: "Dogecoin (DOGE)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.0001,
  },
  {
    value: "AVAX-USD",
    label: "Avalanche (AVAX)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "LINK-USD",
    label: "Chainlink (LINK)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.001,
  },
  {
    value: "DOT-USD",
    label: "Polkadot (DOT)",
    category: "Crypto",
    pipValue: 1.0,
    pipSize: 0.001,
  },

  // ── Indices ───────────────────────────────────────────────────────────────────
  {
    value: "^GSPC",
    label: "S&P 500",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "^NDX",
    label: "NASDAQ 100",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "^DJI",
    label: "Dow Jones",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "^GDAXI",
    label: "DAX (Germany)",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "^FTSE",
    label: "FTSE 100 (UK)",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "^N225",
    label: "Nikkei 225 (Japan)",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 1.0,
  },
  {
    value: "^HSI",
    label: "Hang Seng (HK)",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.1,
  },
  {
    value: "^VIX",
    label: "VIX (Fear Index)",
    category: "Indices",
    pipValue: 1.0,
    pipSize: 0.01,
  },

  // ── US Stocks ─────────────────────────────────────────────────────────────────
  {
    value: "AAPL",
    label: "Apple (AAPL)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "MSFT",
    label: "Microsoft (MSFT)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "GOOGL",
    label: "Alphabet (GOOGL)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "AMZN",
    label: "Amazon (AMZN)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "TSLA",
    label: "Tesla (TSLA)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "NVDA",
    label: "NVIDIA (NVDA)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "META",
    label: "Meta (META)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "SPY",
    label: "S&P 500 ETF (SPY)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "QQQ",
    label: "NASDAQ ETF (QQQ)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
  {
    value: "JPM",
    label: "JPMorgan (JPM)",
    category: "Stocks",
    pipValue: 1.0,
    pipSize: 0.01,
  },
];

// ─── Timeframe Config ───────────────────────────────────────────────────────────
export interface TimeframeConfig {
  value: Timeframe;
  label: string;
  yahooInterval: "1m" | "5m" | "15m" | "1h" | "1d";
  barDurationSec: number; // seconds per bar (for duration calculation)
}

export const TIMEFRAME_OPTIONS: TimeframeConfig[] = [
  { value: "1m", label: "1m", yahooInterval: "1m", barDurationSec: 60 },
  { value: "5m", label: "5m", yahooInterval: "5m", barDurationSec: 300 },
  { value: "15m", label: "15m", yahooInterval: "15m", barDurationSec: 900 },
  { value: "1h", label: "1H", yahooInterval: "1h", barDurationSec: 3600 },
  { value: "4h", label: "4H", yahooInterval: "1d", barDurationSec: 14400 },
  { value: "1d", label: "1D", yahooInterval: "1d", barDurationSec: 86400 },
];
