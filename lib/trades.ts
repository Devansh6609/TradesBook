import { Trade } from "@/types";

interface PnLCalculationParams {
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  quantity: number; // Lot size (e.g., 0.1, 1.0)
  symbol?: string; // Trading symbol to determine contract size
  commission?: number;
  swap?: number;
  fees?: number;
  stopLoss?: number;
}

interface PnLResult {
  pnl: number;
  grossPnL: number;
  netPnL: number;
  rMultiple: number | null;
}

/**
 * Get the contract size (units per lot) for a given symbol
 * - Gold (XAUUSD): 100 oz per lot
 * - Standard forex pairs: 100,000 units per lot (but we calculate in price terms, so use 1)
 * - For gold/silver, we need to multiply by contract size
 */
function getContractMultiplier(symbol?: string): number {
  if (!symbol) return 1;

  const upperSymbol = symbol.toUpperCase();

  // Gold (XAUUSD) - 100 oz per lot, $10 per pip per lot
  // For gold: P&L = priceDiff * lotSize * 100
  if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
    return 100;
  }

  // Silver (XAGUSD) - 5000 oz per lot
  if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
    return 5000;
  }

  // Oil - 1000 barrels per lot
  if (
    upperSymbol.includes("WTI") ||
    upperSymbol.includes("BRENT") ||
    upperSymbol.includes("OIL")
  ) {
    return 1000;
  }

  // Indices - typically 1:1 (varies by broker)
  if (
    upperSymbol.includes("US30") ||
    upperSymbol.includes("NAS") ||
    upperSymbol.includes("SPX") ||
    upperSymbol.includes("DAX") ||
    upperSymbol.includes("FTSE")
  ) {
    return 1;
  }

  // Crypto - typically 1:1
  if (
    upperSymbol.includes("BTC") ||
    upperSymbol.includes("ETH") ||
    upperSymbol.includes("XRP") ||
    upperSymbol.includes("LTC")
  ) {
    return 1;
  }

  // Standard forex pairs - for direct P&L calculation, use 1
  // (the actual P&L comes from the pip value, not contract size)
  // But to match broker behavior: 1 lot = 100,000 units, 0.01 movement = $1000 for 1 lot
  // Simplified: for forex, we calculate P&L as priceDiff * lotSize * 100000 / accountCurrency
  // For USD-denominated accounts with USD as quote currency, this simplifies
  return 100000;
}

export function calculateTradePnL({
  type,
  entryPrice,
  exitPrice,
  quantity,
  symbol,
  commission = 0,
  swap = 0,
  fees = 0,
  stopLoss,
}: PnLCalculationParams): PnLResult {
  const contractMultiplier = getContractMultiplier(symbol);

  // Price difference: positive = profit direction
  const priceDiff =
    type === "BUY" ? exitPrice - entryPrice : entryPrice - exitPrice;

  const upperSymbol = (symbol || "").toUpperCase();

  let grossPnL: number;

  // ── Metals & commodities ──────────────────────────────────────────
  // P&L = priceDiff × lots × contractSize
  // XAUUSD: contractSize = 100 oz, XAGUSD = 5000 oz, Oil = 1000 bbl
  if (
    upperSymbol.includes("XAU") ||
    upperSymbol.includes("XAG") ||
    upperSymbol.includes("WTI") ||
    upperSymbol.includes("BRENT") ||
    upperSymbol.includes("OIL")
  ) {
    grossPnL = priceDiff * quantity * contractMultiplier;
  }

  // ── Indices & Crypto ──────────────────────────────────────────────
  // Broker-specific, assume 1 lot = contractMultiplier (usually 1)
  else if (
    upperSymbol.includes("US30") ||
    upperSymbol.includes("NAS") ||
    upperSymbol.includes("SPX") ||
    upperSymbol.includes("DAX") ||
    upperSymbol.includes("FTSE") ||
    upperSymbol.includes("UK100") ||
    upperSymbol.includes("GER") ||
    upperSymbol.includes("BTC") ||
    upperSymbol.includes("ETH") ||
    upperSymbol.includes("XRP") ||
    upperSymbol.includes("LTC") ||
    upperSymbol.includes("SOL") ||
    upperSymbol.includes("ADA")
  ) {
    grossPnL = priceDiff * quantity * contractMultiplier;
  }

  // ── JPY-quoted pairs (USDJPY, GBPJPY, EURJPY, CADJPY, etc.) ──────
  // 1 pip = 0.01; 1 lot = 100,000 units
  // Raw P&L is in JPY → divide by exit rate to get USD
  // Formula: priceDiff × lots × 100,000 / exitPrice
  else if (upperSymbol.endsWith("JPY") || upperSymbol.includes("JPY")) {
    grossPnL = (priceDiff * quantity * 100000) / exitPrice;
  }

  // ── USD-quoted pairs (EURUSD, GBPUSD, AUDUSD, NZDUSD, …) ─────────
  // Profit is already in USD: priceDiff × lots × 100,000
  else if (upperSymbol.endsWith("USD")) {
    grossPnL = priceDiff * quantity * 100000;
  }

  // ── USD-base pairs (USDCHF, USDCAD, USDNOK, …) ───────────────────
  // Profit is in quote currency; divide by exit price to get USD
  // Formula: priceDiff × lots × 100,000 / exitPrice
  else if (upperSymbol.startsWith("USD")) {
    grossPnL = (priceDiff * quantity * 100000) / exitPrice;
  }

  // ── Any other non-JPY cross (EURGBP, AUDCAD, EURCHF, …) ──────────
  // Approximation: treat as direct-USD pair (account error is small)
  else {
    grossPnL = priceDiff * quantity * 100000;
  }

  // ── Net P&L after fees ────────────────────────────────────────────
  const totalFees = commission + swap + fees;
  const netPnL = grossPnL - totalFees;

  // ── R-Multiple ────────────────────────────────────────────────────
  let rMultiple: number | null = null;
  if (stopLoss && stopLoss > 0 && entryPrice !== stopLoss) {
    const riskPriceDiff = Math.abs(entryPrice - stopLoss);
    let riskAmount: number;

    if (
      upperSymbol.includes("XAU") ||
      upperSymbol.includes("XAG") ||
      upperSymbol.includes("WTI") ||
      upperSymbol.includes("BRENT") ||
      upperSymbol.includes("OIL")
    ) {
      riskAmount = riskPriceDiff * quantity * contractMultiplier;
    } else if (upperSymbol.endsWith("JPY") || upperSymbol.includes("JPY")) {
      riskAmount = (riskPriceDiff * quantity * 100000) / exitPrice;
    } else if (upperSymbol.startsWith("USD") && !upperSymbol.endsWith("USD")) {
      riskAmount = (riskPriceDiff * quantity * 100000) / exitPrice;
    } else {
      riskAmount = riskPriceDiff * quantity * contractMultiplier;
    }

    if (riskAmount > 0) {
      rMultiple = netPnL / riskAmount;
    }
  }

  return {
    pnl: grossPnL,
    grossPnL,
    netPnL,
    rMultiple,
  };
}

/**
 * Calculate pips for forex/gold trades
 * @param symbol - Trading symbol (e.g., EURUSD, XAUUSD, USDJPY)
 * @param entryPrice - Entry price
 * @param exitPrice - Exit price
 * @param type - Trade type (BUY or SELL)
 * @returns Number of pips (positive for profit, negative for loss)
 */
export function calculatePips(
  symbol: string,
  entryPrice: number,
  exitPrice: number,
  type: "BUY" | "SELL",
): number {
  const upperSymbol = symbol.toUpperCase();

  // Determine pip value based on symbol type
  let pipMultiplier: number;

  // JPY pairs - pip is 0.01
  if (upperSymbol.includes("JPY")) {
    pipMultiplier = 100; // 1 pip = 0.01
  }
  // Gold (XAUUSD) - pip is 0.10 (10 cents)
  else if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
    pipMultiplier = 10; // 1 pip = 0.10
  }
  // Silver (XAGUSD) - pip is 0.01
  else if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
    pipMultiplier = 100; // 1 pip = 0.01
  }
  // Indices (US30, NAS100, SPX500, etc.) - pip is 1.0
  else if (
    upperSymbol.includes("US30") ||
    upperSymbol.includes("NAS") ||
    upperSymbol.includes("SPX") ||
    upperSymbol.includes("DAX") ||
    upperSymbol.includes("FTSE")
  ) {
    pipMultiplier = 1; // 1 pip = 1.0 point
  }
  // Crypto (BTCUSD, ETHUSD) - pip is 1.0
  else if (
    upperSymbol.includes("BTC") ||
    upperSymbol.includes("ETH") ||
    upperSymbol.includes("XRP") ||
    upperSymbol.includes("LTC")
  ) {
    pipMultiplier = 1; // 1 pip = 1.0
  }
  // Standard forex pairs (EURUSD, GBPUSD, etc.) - pip is 0.0001
  else {
    pipMultiplier = 10000; // 1 pip = 0.0001
  }

  // Calculate raw price difference
  let priceDiff: number;
  if (type === "BUY") {
    priceDiff = exitPrice - entryPrice;
  } else {
    priceDiff = entryPrice - exitPrice;
  }

  // Convert to pips
  return priceDiff * pipMultiplier;
}

/**
 * Calculate P&L in dollars for forex trades
 * @param symbol - Trading symbol
 * @param pips - Number of pips
 * @param lotSize - Lot size (e.g., 0.1, 1.0)
 * @returns P&L in dollars
 */
export function calculatePnLFromPips(
  symbol: string,
  pips: number,
  lotSize: number,
): number {
  const upperSymbol = symbol.toUpperCase();

  // Standard lot size pip values (per 1.0 lot)
  let pipValue: number;

  // Gold (XAUUSD) - $1 per pip per 0.01 lot
  if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
    pipValue = 100 * lotSize; // $100 per pip per lot
  }
  // JPY pairs - approximately $9.09 per pip per lot
  else if (upperSymbol.includes("JPY")) {
    pipValue = 909.09 * lotSize; // Approximate for JPY pairs
  }
  // Indices
  else if (
    upperSymbol.includes("US30") ||
    upperSymbol.includes("NAS") ||
    upperSymbol.includes("SPX")
  ) {
    pipValue = 1 * lotSize; // Varies by broker
  }
  // Standard forex pairs - $10 per pip per lot
  else {
    pipValue = 10 * lotSize;
  }

  return pips * pipValue;
}

export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((t) => (t.pnl || 0) > 0).length;
  return (winningTrades / trades.length) * 100;
}

export function calculateProfitFactor(trades: Trade[]): number {
  const winningTrades = trades.filter((t) => (t.pnl || 0) > 0);
  const losingTrades = trades.filter((t) => (t.pnl || 0) < 0);

  const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(
    losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
  );

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
  return totalWins / totalLosses;
}

export function calculateAveragePnL(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const totalPnL = trades.reduce((sum, t) => sum + (t.netPnl || t.pnl || 0), 0);
  return totalPnL / trades.length;
}

export function calculateAverageWin(trades: Trade[]): number {
  const winningTrades = trades.filter((t) => (t.pnl || 0) > 0);
  if (winningTrades.length === 0) return 0;
  const totalWins = winningTrades.reduce(
    (sum, t) => sum + (t.netPnl || t.pnl || 0),
    0,
  );
  return totalWins / winningTrades.length;
}

export function calculateAverageLoss(trades: Trade[]): number {
  const losingTrades = trades.filter((t) => (t.pnl || 0) < 0);
  if (losingTrades.length === 0) return 0;
  const totalLosses = losingTrades.reduce(
    (sum, t) => sum + (t.netPnl || t.pnl || 0),
    0,
  );
  return totalLosses / losingTrades.length;
}

export function calculateExpectancy(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const winRate = calculateWinRate(trades) / 100;
  const avgWin = calculateAverageWin(trades);
  const avgLoss = Math.abs(calculateAverageLoss(trades));

  return winRate * avgWin - (1 - winRate) * avgLoss;
}

export function calculateRMultipleAverage(trades: Trade[]): number {
  const tradesWithR = trades.filter(
    (t) => t.rMultiple !== null && t.rMultiple !== undefined,
  );
  if (tradesWithR.length === 0) return 0;

  const totalR = tradesWithR.reduce((sum, t) => sum + (t.rMultiple || 0), 0);
  return totalR / tradesWithR.length;
}

export function calculateLargestWin(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return Math.max(...trades.map((t) => t.netPnl || t.pnl || 0), 0);
}

export function calculateLargestLoss(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return Math.min(...trades.map((t) => t.netPnl || t.pnl || 0), 0);
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatPnL(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";

  const formatted = formatCurrency(num);
  return num >= 0 ? `+${formatted}` : formatted;
}

export function getPnLColor(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "text-foreground-muted";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "text-foreground-muted";

  if (num > 0) return "text-profit";
  if (num < 0) return "text-loss";
  return "text-foreground-muted";
}

export function getTradeStatusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "CLOSED":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "CANCELLED":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case "PENDING":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

export function getTypeColor(type: "BUY" | "SELL"): string {
  return type === "BUY" ? "text-profit" : "text-loss";
}

export function getTypeBgColor(type: "BUY" | "SELL"): string {
  return type === "BUY"
    ? "bg-profit/10 text-profit border-profit/20"
    : "bg-loss/10 text-loss border-loss/20";
}

export function sortTrades(
  trades: Trade[],
  sortBy: keyof Trade,
  sortOrder: "asc" | "desc" = "desc",
): Trade[] {
  return [...trades].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === undefined || aValue === null)
      return sortOrder === "asc" ? -1 : 1;
    if (bValue === undefined || bValue === null)
      return sortOrder === "asc" ? 1 : -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });
}

export function filterTrades(
  trades: Trade[],
  filters: {
    symbol?: string;
    type?: "BUY" | "SELL";
    status?: string;
    strategyId?: string;
    dateFrom?: string;
    dateTo?: string;
    minPnl?: number;
    maxPnl?: number;
  },
): Trade[] {
  return trades.filter((trade) => {
    if (
      filters.symbol &&
      !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
    ) {
      return false;
    }

    if (filters.type && trade.type !== filters.type) {
      return false;
    }

    if (filters.status && trade.status !== filters.status) {
      return false;
    }

    if (filters.strategyId && trade.strategyId !== filters.strategyId) {
      return false;
    }

    if (filters.dateFrom) {
      const tradeDate = new Date(trade.entryDate);
      const fromDate = new Date(filters.dateFrom);
      if (tradeDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const tradeDate = new Date(trade.entryDate);
      const toDate = new Date(filters.dateTo);
      if (tradeDate > toDate) return false;
    }

    if (filters.minPnl !== undefined) {
      const pnl = parseFloat(trade.pnl?.toString() || "0");
      if (pnl < filters.minPnl) return false;
    }

    if (filters.maxPnl !== undefined) {
      const pnl = parseFloat(trade.pnl?.toString() || "0");
      if (pnl > filters.maxPnl) return false;
    }

    return true;
  });
}

export function generateTradeStatistics(trades: Trade[]) {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(
    (t) => parseFloat(t.pnl?.toString() || "0") > 0,
  ).length;
  const losingTrades = trades.filter(
    (t) => parseFloat(t.pnl?.toString() || "0") < 0,
  ).length;
  const breakevenTrades = trades.filter(
    (t) => parseFloat(t.pnl?.toString() || "0") === 0,
  ).length;

  const totalPnl = trades.reduce(
    (sum, t) =>
      sum + parseFloat(t.netPnl?.toString() || t.pnl?.toString() || "0"),
    0,
  );
  const grossPnl = trades.reduce(
    (sum, t) => sum + parseFloat(t.pnl?.toString() || "0"),
    0,
  );

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
    lossRate: totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0,
    breakevenRate: totalTrades > 0 ? (breakevenTrades / totalTrades) * 100 : 0,
    totalPnl,
    grossPnl,
    averageTrade: totalTrades > 0 ? totalPnl / totalTrades : 0,
    averageWin: calculateAverageWin(trades),
    averageLoss: calculateAverageLoss(trades),
    largestWin: calculateLargestWin(trades),
    largestLoss: calculateLargestLoss(trades),
    profitFactor: calculateProfitFactor(trades),
    expectancy: calculateExpectancy(trades),
    rMultipleAvg: calculateRMultipleAverage(trades),
  };
}
