import {
  Trade,
  EquityPoint,
  DailyPnLPoint,
  SymbolPerformance,
  StrategyPerformance,
} from "@/types";

// Win Rate = Winning Trades / Total Trades × 100
export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((t) => getTradePnL(t) > 0).length;
  return (winningTrades / trades.length) * 100;
}

// Profit Factor = Gross Profit / Gross Loss
export function calculateProfitFactor(trades: Trade[]): number {
  const winningTrades = trades.filter((t) => getTradePnL(t) > 0);
  const losingTrades = trades.filter((t) => getTradePnL(t) < 0);

  const totalWins = winningTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
  const totalLosses = Math.abs(
    losingTrades.reduce((sum, t) => sum + getTradePnL(t), 0),
  );

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
  return totalWins / totalLosses;
}

// Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
export function calculateExpectancy(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const winRate = calculateWinRate(trades) / 100;
  const avgWin = calculateAverageWin(trades);
  const avgLoss = Math.abs(calculateAverageLoss(trades));

  return winRate * avgWin - (1 - winRate) * avgLoss;
}

// Max Drawdown = (Peak - Trough) / Peak × 100
export function calculateMaxDrawdown(trades: Trade[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
} {
  if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0 };

  const sortedTrades = [...trades]
    .filter((t) => t.exitDate && getTradePnL(t) !== undefined)
    .sort(
      (a, b) =>
        new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime(),
    );

  if (sortedTrades.length === 0)
    return { maxDrawdown: 0, maxDrawdownPercent: 0 };

  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let runningTotal = 0;

  for (const trade of sortedTrades) {
    const pnl = getTradePnL(trade);
    runningTotal += pnl;

    if (runningTotal > peak) {
      peak = runningTotal;
    }

    const drawdown = peak - runningTotal;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    }
  }

  return { maxDrawdown, maxDrawdownPercent };
}

// Average Trade = Total Net P&L / Number of Trades
export function calculateAverageTrade(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const totalPnL = trades.reduce((sum, t) => sum + getTradePnL(t), 0);
  return totalPnL / trades.length;
}

// Average Win
export function calculateAverageWin(trades: Trade[]): number {
  const winningTrades = trades.filter((t) => getTradePnL(t) > 0);
  if (winningTrades.length === 0) return 0;
  const totalWins = winningTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
  return totalWins / winningTrades.length;
}

// Average Loss
export function calculateAverageLoss(trades: Trade[]): number {
  const losingTrades = trades.filter((t) => getTradePnL(t) < 0);
  if (losingTrades.length === 0) return 0;
  const totalLosses = losingTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
  return totalLosses / losingTrades.length;
}

// Risk-Reward Ratio = Average Win / Average Loss
export function calculateRiskRewardRatio(trades: Trade[]): number {
  const avgWin = calculateAverageWin(trades);
  const avgLoss = Math.abs(calculateAverageLoss(trades));

  if (avgLoss === 0) return avgWin > 0 ? Infinity : 0;
  return avgWin / avgLoss;
}

// Sharpe Ratio (simplified) - assumes 252 trading days per year
export function calculateSharpeRatio(
  trades: Trade[],
  riskFreeRate: number = 0.02,
): number {
  if (trades.length < 2) return 0;

  const dailyReturns = calculateDailyPnL(trades);
  if (dailyReturns.length < 2) return 0;

  const returns = dailyReturns.map((d) => Number(d.pnl));
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate standard deviation
  const squaredDiffs = returns.map((r) => Math.pow(r - avgReturn, 2));
  const variance =
    squaredDiffs.reduce((sum, d) => sum + d, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Annualized Sharpe ratio
  const annualizedReturn = avgReturn * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

// Average Hold Time (in hours)
export function calculateAverageHoldTime(trades: Trade[]): number {
  const closedTrades = trades.filter((t) => t.exitDate && t.entryDate);
  if (closedTrades.length === 0) return 0;

  const totalDuration = closedTrades.reduce((sum, t) => {
    const start = new Date(t.entryDate).getTime();
    const end = new Date(t.exitDate!).getTime();
    return sum + (end - start);
  }, 0);

  return totalDuration / closedTrades.length / (1000 * 60 * 60); // Convert ms to hours
}

// Helper function to get trade P&L
function getTradePnL(trade: Trade): number {
  return trade.netPnl ?? trade.pnl ?? 0;
}

// Generate equity curve data
export function generateEquityCurve(
  trades: Trade[],
  initialBalance: number = 10000,
): EquityPoint[] {
  const sortedTrades = [...trades]
    .filter((t) => t.exitDate && getTradePnL(t) !== undefined)
    .sort(
      (a, b) =>
        new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime(),
    );

  if (sortedTrades.length === 0) return [];

  const equityCurve: EquityPoint[] = [];
  let currentBalance = initialBalance;
  let peak = initialBalance;

  for (const trade of sortedTrades) {
    const pnl = getTradePnL(trade);
    currentBalance += pnl;

    if (currentBalance > peak) {
      peak = currentBalance;
    }

    const drawdown = peak - currentBalance;

    equityCurve.push({
      time: trade.exitDate!,
      value: currentBalance,
      drawdown: drawdown,
    });
  }

  return equityCurve;
}

// Daily P&L aggregation
export function calculateDailyPnL(trades: Trade[]): DailyPnLPoint[] {
  const sortedTrades = [...trades]
    .filter((t) => t.exitDate && getTradePnL(t) !== undefined)
    .sort(
      (a, b) =>
        new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime(),
    );

  if (sortedTrades.length === 0) return [];

  const dailyMap = new Map<string, { pnl: number; trades: number }>();

  for (const trade of sortedTrades) {
    const date = new Date(trade.exitDate!).toISOString().split("T")[0];
    const current = dailyMap.get(date) || { pnl: 0, trades: 0 };
    dailyMap.set(date, {
      pnl: current.pnl + getTradePnL(trade),
      trades: current.trades + 1,
    });
  }

  const dailyPnL: DailyPnLPoint[] = [];
  let cumulativePnl = 0;

  // Sort dates and create array
  const sortedDates = Array.from(dailyMap.keys()).sort();

  for (const date of sortedDates) {
    const data = dailyMap.get(date)!;
    cumulativePnl += data.pnl;
    dailyPnL.push({
      date,
      pnl: data.pnl.toString(),
      trades: data.trades,
      cumulativePnl: cumulativePnl.toString(),
    });
  }

  return dailyPnL;
}

// Performance by symbol
export function calculateSymbolPerformance(
  trades: Trade[],
): SymbolPerformance[] {
  const symbolMap = new Map<string, Trade[]>();

  for (const trade of trades) {
    if (!symbolMap.has(trade.symbol)) {
      symbolMap.set(trade.symbol, []);
    }
    symbolMap.get(trade.symbol)!.push(trade);
  }

  const performance: SymbolPerformance[] = [];

  for (const [symbol, symbolTrades] of symbolMap) {
    const totalTrades = symbolTrades.length;
    const winningTrades = symbolTrades.filter((t) => getTradePnL(t) > 0).length;
    const losingTrades = symbolTrades.filter((t) => getTradePnL(t) < 0).length;
    const totalPnl = symbolTrades.reduce((sum, t) => sum + getTradePnL(t), 0);

    performance.push({
      symbol,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      totalPnl,
      averagePnl: totalTrades > 0 ? totalPnl / totalTrades : 0,
      profitFactor: calculateProfitFactor(symbolTrades),
    });
  }

  return performance.sort((a, b) => b.totalPnl - a.totalPnl);
}

// Performance by strategy
export function calculateStrategyPerformance(
  trades: Trade[],
): StrategyPerformance[] {
  const strategyMap = new Map<string, { trades: Trade[]; name: string }>();

  for (const trade of trades) {
    const key = trade.strategyId || "no-strategy";
    const name = trade.strategy?.name || "No Strategy";

    if (!strategyMap.has(key)) {
      strategyMap.set(key, { trades: [], name });
    }
    strategyMap.get(key)!.trades.push(trade);
  }

  const performance: StrategyPerformance[] = [];

  for (const [strategyId, data] of strategyMap) {
    const { trades: strategyTrades, name } = data;
    const totalTrades = strategyTrades.length;
    const winningTrades = strategyTrades.filter(
      (t) => getTradePnL(t) > 0,
    ).length;
    const losingTrades = strategyTrades.filter(
      (t) => getTradePnL(t) < 0,
    ).length;
    const totalPnl = strategyTrades.reduce((sum, t) => sum + getTradePnL(t), 0);

    performance.push({
      strategyId,
      strategyName: name,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      totalPnl,
      averagePnl: totalTrades > 0 ? totalPnl / totalTrades : 0,
      profitFactor: calculateProfitFactor(strategyTrades),
      expectancy: calculateExpectancy(strategyTrades),
    });
  }

  return performance.sort((a, b) => b.totalPnl - a.totalPnl);
}

// Best trades
export function getBestTrades(trades: Trade[], limit: number = 5): Trade[] {
  return [...trades]
    .filter((t) => getTradePnL(t) > 0)
    .sort((a, b) => getTradePnL(b) - getTradePnL(a))
    .slice(0, limit);
}

// Worst trades
export function getWorstTrades(trades: Trade[], limit: number = 5): Trade[] {
  return [...trades]
    .filter((t) => getTradePnL(t) < 0)
    .sort((a, b) => getTradePnL(a) - getTradePnL(b))
    .slice(0, limit);
}

// Consecutive wins/losses
export function calculateConsecutiveStats(trades: Trade[]): {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
} {
  const sortedTrades = [...trades]
    .filter((t) => t.exitDate && getTradePnL(t) !== undefined)
    .sort(
      (a, b) =>
        new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime(),
    );

  if (sortedTrades.length === 0)
    return { maxConsecutiveWins: 0, maxConsecutiveLosses: 0 };

  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  for (const trade of sortedTrades) {
    const pnl = getTradePnL(trade);

    if (pnl > 0) {
      currentWins++;
      currentLosses = 0;
      if (currentWins > maxConsecutiveWins) {
        maxConsecutiveWins = currentWins;
      }
    } else if (pnl < 0) {
      currentLosses++;
      currentWins = 0;
      if (currentLosses > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentLosses;
      }
    }
  }

  return { maxConsecutiveWins, maxConsecutiveLosses };
}

// Total P&L
export function calculateTotalPnL(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + getTradePnL(t), 0);
}

// Gross Profit
export function calculateGrossProfit(trades: Trade[]): number {
  return trades
    .filter((t) => getTradePnL(t) > 0)
    .reduce((sum, t) => sum + getTradePnL(t), 0);
}

// Gross Loss
export function calculateGrossLoss(trades: Trade[]): number {
  return trades
    .filter((t) => getTradePnL(t) < 0)
    .reduce((sum, t) => sum + getTradePnL(t), 0);
}

// Best trade
export function getBestTrade(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return Math.max(...trades.map((t) => getTradePnL(t)), 0);
}

// Worst trade
export function getWorstTrade(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return Math.min(...trades.map((t) => getTradePnL(t)), 0);
}

// Calculate all analytics summary
export function calculateAnalyticsSummary(trades: Trade[]) {
  const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(trades);
  const { maxConsecutiveWins, maxConsecutiveLosses } =
    calculateConsecutiveStats(trades);

  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const openTrades = trades.filter((t) => t.status === "OPEN");

  const realizedPnL = closedTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
  const unrealizedPnL = openTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalPnL = realizedPnL + unrealizedPnL;

  const breakEvenTrades = closedTrades.filter(
    (t) => getTradePnL(t) === 0,
  ).length;
  const totalCommissions = closedTrades.reduce(
    (sum, t) => sum + (t.commission || 0),
    0,
  );
  const totalSwap = closedTrades.reduce((sum, t) => sum + (t.swap || 0), 0);
  const avgDailyVolume = calculateAverageDailyVolume(closedTrades);
  const holdTimeStats = calculateHoldTimeStats(closedTrades);

  return {
    totalPnL,
    realizedPnL,
    unrealizedPnL,
    winRate: calculateWinRate(closedTrades),
    profitFactor: calculateProfitFactor(closedTrades),
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    openTrades: openTrades.length,
    breakEvenTrades,
    averageTrade: calculateAverageTrade(closedTrades),
    maxDrawdown,
    maxDrawdownPercent,
    expectancy: calculateExpectancy(closedTrades),
    sharpeRatio: calculateSharpeRatio(closedTrades),
    averageWin: calculateAverageWin(closedTrades),
    averageLoss: calculateAverageLoss(closedTrades),
    riskRewardRatio: calculateRiskRewardRatio(closedTrades),
    grossProfit: calculateGrossProfit(closedTrades),
    grossLoss: calculateGrossLoss(closedTrades),
    maxConsecutiveWins,
    maxConsecutiveLosses,
    bestTrade: getBestTrade(closedTrades),
    worstTrade: getWorstTrade(closedTrades),
    averageHoldTime: calculateAverageHoldTime(closedTrades),
    holdTimeStats,
    totalCommissions,
    totalSwap,
    averageDailyVolume: avgDailyVolume,
    winningTrades: closedTrades.filter((t) => getTradePnL(t) > 0).length,
    losingTrades: closedTrades.filter((t) => getTradePnL(t) < 0).length,
  };
}

// Day of Week Performance
export function calculateDayOfWeekPerformance(trades: Trade[]): {
  day: string;
  pnl: number;
  trades: number;
  winRate: number;
}[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // 0=Sun, 1=Mon, ..., 6=Sat
  const dayStats = new Map<
    number,
    { pnl: number; trades: number; wins: number }
  >();

  // Initialize with 0
  for (let i = 0; i < 7; i++) {
    dayStats.set(i, { pnl: 0, trades: 0, wins: 0 });
  }

  for (const trade of trades) {
    if (!trade.exitDate) continue;
    const dayIndex = new Date(trade.exitDate).getDay();
    const stats = dayStats.get(dayIndex)!;
    const pnl = getTradePnL(trade);

    stats.pnl += pnl;
    stats.trades += 1;
    if (pnl > 0) stats.wins += 1;
  }

  // Return ordered Mon -> Sun
  const result = [];
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun

  for (const dayIndex of order) {
    const stats = dayStats.get(dayIndex)!;
    result.push({
      day: dayNames[dayIndex],
      pnl: stats.pnl,
      trades: stats.trades,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
    });
  }

  return result;
}

// Long vs Short Performance
export function calculateLongShortPerformance(trades: Trade[]) {
  const longTrades = trades.filter((t) => t.type === "BUY");
  const shortTrades = trades.filter((t) => t.type === "SELL");

  const getStats = (t: Trade[]) => {
    const total = t.length;
    const wins = t.filter((x) => getTradePnL(x) > 0).length;
    const pnl = t.reduce((sum, x) => sum + getTradePnL(x), 0);
    return {
      trades: total,
      pnl,
      winRate: total > 0 ? (wins / total) * 100 : 0,
      bestTrade: getBestTrade(t),
    };
  };

  return {
    long: getStats(longTrades),
    short: getStats(shortTrades),
  };
}

export function calculateEquityCurve(
  trades: Trade[],
  initialBalance: number = 0,
): EquityPoint[] {
  const sortedTrades = [...trades]
    .filter(
      (t) => t.exitDate && (t.pnl !== undefined || t.netPnl !== undefined),
    )
    .sort(
      (a, b) =>
        new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime(),
    );

  let currentEquity = initialBalance;
  let peakEquity = initialBalance;
  const points: EquityPoint[] = [];

  // Add starting point
  if (sortedTrades.length > 0) {
    points.push({
      time: new Date(
        new Date(sortedTrades[0].exitDate!).getTime() - 86400000,
      ).toISOString(),
      value: initialBalance,
      drawdown: 0,
    });
  } else {
    // If no trades, just show initial balance
    points.push({
      time: new Date().toISOString(),
      value: initialBalance,
      drawdown: 0,
    });
  }

  for (const trade of sortedTrades) {
    const pnl = getTradePnL(trade);
    currentEquity += pnl;

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    const drawdown = currentEquity - peakEquity;

    points.push({
      time: trade.exitDate!,
      value: currentEquity,
      drawdown: drawdown,
    });
  }

  return points;
}

// Average Daily Volume
export function calculateAverageDailyVolume(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const dailyVolumeMap = new Map<string, number>();
  for (const trade of trades) {
    if (!trade.exitDate) continue;
    const date = new Date(trade.exitDate).toISOString().split("T")[0];
    const volume = trade.quantity || 0;
    dailyVolumeMap.set(date, (dailyVolumeMap.get(date) || 0) + volume);
  }

  const totalTradingDays = dailyVolumeMap.size;
  if (totalTradingDays === 0) return 0;

  const totalVolume = Array.from(dailyVolumeMap.values()).reduce(
    (sum, v) => sum + v,
    0,
  );
  return totalVolume / totalTradingDays;
}

// Hold Time Stats Breakout
export function calculateHoldTimeStats(trades: Trade[]): {
  all: string;
  winners: string;
  losers: string;
} {
  const getHoldTimeStr = (t: Trade[]) => {
    const closedTrades = t.filter((x) => x.entryDate && x.exitDate);
    if (closedTrades.length === 0) return "-";
    const totalMs = closedTrades.reduce((sum, x) => {
      return (
        sum +
        (new Date(x.exitDate!).getTime() - new Date(x.entryDate).getTime())
      );
    }, 0);
    const avgMs = totalMs / closedTrades.length;

    // Format to "1d 5h" or "5h 30m" etc
    const days = Math.floor(avgMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return "< 1m";
  };

  const winners = trades.filter((t) => getTradePnL(t) > 0);
  const losers = trades.filter((t) => getTradePnL(t) < 0);

  return {
    all: getHoldTimeStr(trades),
    winners: getHoldTimeStr(winners),
    losers: getHoldTimeStr(losers),
  };
}

// Monthly Stats
export function calculateMonthlyStats(trades: Trade[]) {
  if (trades.length === 0)
    return {
      bestMonth: { value: 0, label: "-" },
      worstMonth: { value: 0, label: "-" },
      averagePerMonth: 0,
    };

  const monthlyMap = new Map<string, number>();
  for (const trade of trades) {
    if (!trade.exitDate) continue;
    const date = new Date(trade.exitDate);
    const monthYear = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    monthlyMap.set(
      monthYear,
      (monthlyMap.get(monthYear) || 0) + getTradePnL(trade),
    );
  }

  if (monthlyMap.size === 0)
    return {
      bestMonth: { value: 0, label: "-" },
      worstMonth: { value: 0, label: "-" },
      averagePerMonth: 0,
    };

  let bestMonth = { value: -Infinity, label: "-" };
  let worstMonth = { value: Infinity, label: "-" };
  let totalPnl = 0;

  for (const [label, pnl] of monthlyMap.entries()) {
    if (pnl > bestMonth.value) bestMonth = { value: pnl, label };
    if (pnl < worstMonth.value) worstMonth = { value: pnl, label };
    totalPnl += pnl;
  }

  return {
    bestMonth,
    worstMonth,
    averagePerMonth: totalPnl / monthlyMap.size,
  };
}

// Session Performance
export function calculateSessionPerformance(trades: Trade[]) {
  const getSessionStats = (t: Trade[]) => {
    const total = t.length;
    const wins = t.filter((x) => getTradePnL(x) > 0).length;
    const pnl = t.reduce((sum, x) => sum + getTradePnL(x), 0);
    const avgTrade = total > 0 ? pnl / total : 0;
    const volume = t.reduce((sum, x) => sum + (x.quantity || 0), 0);
    return {
      trades: total,
      pnl,
      winRate: total > 0 ? (wins / total) * 100 : 0,
      avgTrade,
      volume,
    };
  };

  const asian = trades.filter((t) => {
    if (!t.entryDate) return false;
    const hour = new Date(t.entryDate).getUTCHours();
    return hour >= 22 || hour < 8;
  });

  const london = trades.filter((t) => {
    if (!t.entryDate) return false;
    const hour = new Date(t.entryDate).getUTCHours();
    return hour >= 8 && hour < 13;
  });

  const newYork = trades.filter((t) => {
    if (!t.entryDate) return false;
    const hour = new Date(t.entryDate).getUTCHours();
    return hour >= 13 && hour < 22;
  });

  const totalVolume = trades.reduce((sum, x) => sum + (x.quantity || 0), 0);

  const aStats = getSessionStats(asian);
  const lStats = getSessionStats(london);
  const nyStats = getSessionStats(newYork);

  return {
    asian: {
      ...aStats,
      volumePercent: totalVolume > 0 ? (aStats.volume / totalVolume) * 100 : 0,
    },
    london: {
      ...lStats,
      volumePercent: totalVolume > 0 ? (lStats.volume / totalVolume) * 100 : 0,
    },
    newYork: {
      ...nyStats,
      volumePercent: totalVolume > 0 ? (nyStats.volume / totalVolume) * 100 : 0,
    },
  };
}

// Daily Extended Stats
export function calculateDailyExtendedStats(
  dailyPnLDesc: { date: string; pnl: number; trades: number }[],
) {
  if (dailyPnLDesc.length === 0) {
    return {
      totalTradingDays: 0,
      winningDays: 0,
      losingDays: 0,
      breakevenDays: 0,
      maxConsecutiveWinningDays: 0,
      maxConsecutiveLosingDays: 0,
      averageDailyPnL: 0,
      averageWinningDayPnL: 0,
      averageLosingDayPnL: 0,
      largestProfitableDay: 0,
      largestLosingDay: 0,
    };
  }

  const dailyPnL = [...dailyPnLDesc].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let winningDays = 0,
    losingDays = 0,
    breakevenDays = 0;
  let maxConsecutiveWinningDays = 0,
    maxConsecutiveLosingDays = 0;
  let currWinDays = 0,
    currLossDays = 0;
  let largestProfitableDay = 0,
    largestLosingDay = 0;
  let totalWinningDayPnl = 0,
    totalLosingDayPnl = 0;
  let totalPnl = 0;

  for (const day of dailyPnL) {
    if (day.pnl > 0) {
      winningDays++;
      totalWinningDayPnl += day.pnl;
      if (day.pnl > largestProfitableDay) largestProfitableDay = day.pnl;

      currWinDays++;
      currLossDays = 0;
      if (currWinDays > maxConsecutiveWinningDays)
        maxConsecutiveWinningDays = currWinDays;
    } else if (day.pnl < 0) {
      losingDays++;
      totalLosingDayPnl += day.pnl;
      if (day.pnl < largestLosingDay) largestLosingDay = day.pnl;

      currLossDays++;
      currWinDays = 0;
      if (currLossDays > maxConsecutiveLosingDays)
        maxConsecutiveLosingDays = currLossDays;
    } else {
      breakevenDays++;
      currWinDays = 0;
      currLossDays = 0;
    }
    totalPnl += day.pnl;
  }

  const totalDays = dailyPnL.length;

  return {
    totalTradingDays: totalDays,
    winningDays,
    losingDays,
    breakevenDays,
    maxConsecutiveWinningDays,
    maxConsecutiveLosingDays,
    averageDailyPnL: totalDays > 0 ? totalPnl / totalDays : 0,
    averageWinningDayPnL:
      winningDays > 0 ? totalWinningDayPnl / winningDays : 0,
    averageLosingDayPnL: losingDays > 0 ? totalLosingDayPnl / losingDays : 0,
    largestProfitableDay,
    largestLosingDay,
  };
}
