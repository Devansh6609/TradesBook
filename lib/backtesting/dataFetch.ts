import { OHLCVBar } from "./types";

/**
 * Fetches OHLCV historical data directly from Yahoo Finance v8 API.
 * Used by the backtest runner server-side without going through HTTP middleware.
 */
export async function fetchHistoricalData(
  symbol: string,
  from: string,
  to: string,
  interval: "1d" | "1wk" | "1mo",
): Promise<OHLCVBar[]> {
  const fromTimestamp = Math.floor(new Date(from).getTime() / 1000);
  const toTimestamp = Math.floor(new Date(to).getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${fromTimestamp}&period2=${toTimestamp}&interval=${interval}&includePrePost=false`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `Yahoo Finance returned ${response.status} for "${symbol}". Check if the symbol is correct (e.g. use EURUSD=X for forex, BTC-USD for crypto).`,
    );
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];

  if (!result) {
    throw new Error(
      `No data found for symbol "${symbol}". Try: EURUSD=X (forex), BTC-USD (crypto), AAPL (stocks), GC=F (gold).`,
    );
  }

  const timestamps: number[] = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0];

  if (!timestamps.length || !quotes) {
    throw new Error(
      `No price data available for "${symbol}" in the given date range. Try a wider date range.`,
    );
  }

  const rawBars: OHLCVBar[] = timestamps
    .map((time: number, i: number) => ({
      time,
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      volume: quotes.volume?.[i],
    }))
    .filter(
      (bar: OHLCVBar) =>
        bar.open != null &&
        bar.high != null &&
        bar.low != null &&
        bar.close != null &&
        !isNaN(bar.close),
    );

  // Strict deduplication: ensure no duplicate timestamps
  const bars: OHLCVBar[] = [];
  const seenTimes = new Set<number>();
  for (const bar of rawBars) {
    if (!seenTimes.has(bar.time as number)) {
      seenTimes.add(bar.time as number);
      bars.push(bar);
    }
  }

  if (bars.length < 30) {
    throw new Error(
      `Only ${bars.length} bars found for "${symbol}". Please use a wider date range or a different timeframe.`,
    );
  }

  return bars;
}
