
import { Trade } from "@/types";

export interface FundedAccountStats {
    currentBalance: number;
    totalPnL: number;
    pnlPercentage: number;
    profitTargetAmount: number;
    profitRemaining: number;
    
    dailyDrawdownUsed: number;
    dailyDrawdownRemaining: number;
    dailyDrawdownLimitAmount: number;
    
    maxDrawdownUsed: number;
    maxDrawdownRemaining: number;
    maxDrawdownLimitAmount: number;
    
    isDailyDrawdownBreached: boolean;
    isMaxDrawdownBreached: boolean;
    isTargetMet: boolean;

    // Premium KPIs
    winRate: number;
    consecutiveLossCount: number;
    dailyProfit: number;
    dailyProfitTargetReached: boolean;
    equityCurve: number[];
}

export function calculateFundedAccountStats(
    account: {
        startingBalance: number;
        accountSize: number;
        dailyDrawdownLimit: number;
        maxDrawdownLimit: number;
        profitTarget: number;
    },
    trades: Trade[],
    unrealizedPnl: number = 0
): FundedAccountStats {
    // Sort trades by date for chronological curve and consecutive checks
    const sortedTrades = [...trades].sort((a, b) => 
        new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime()
    );

    const closedPnL = sortedTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const totalPnL = closedPnL + unrealizedPnl;
    const currentBalance = account.startingBalance + closedPnL;
    const currentEquity = currentBalance + unrealizedPnl;
    
    const pnlPercentage = (totalPnL / account.accountSize) * 100;
    
    const profitTargetAmount = (account.profitTarget / 100) * account.accountSize;
    const profitRemaining = Math.max(0, profitTargetAmount - totalPnL);
    const isTargetMet = totalPnL >= profitTargetAmount;

    // Performance Stats
    const closedTrades = sortedTrades.filter(t => t.status === 'CLOSED');
    const winningTrades = closedTrades.filter(t => (t.netPnl || 0) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    // Consecutive Losses (recent)
    let consecutiveLossCount = 0;
    for (let i = closedTrades.length - 1; i >= 0; i--) {
        if ((closedTrades[i].netPnl || 0) < 0) {
            consecutiveLossCount++;
        } else if ((closedTrades[i].netPnl || 0) > 0) {
            break;
        }
    }

    // Daily Stats
    const today = new Date().setHours(0, 0, 0, 0);
    const todayTrades = sortedTrades.filter(t => t.exitDate && new Date(t.exitDate).setHours(0, 0, 0, 0) === today);
    const dailyProfit = todayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0) + unrealizedPnl;
    
    // Daily Profit target suggested at 1% for most firms
    const dailyProfitTargetAmount = 0.01 * account.accountSize;
    const dailyProfitTargetReached = dailyProfit >= dailyProfitTargetAmount;

    // Daily Drawdown logic
    const dayStartBalance = currentBalance - (dailyProfit - unrealizedPnl);
    const dailyDrawdownLimitAmount = (account.dailyDrawdownLimit / 100) * account.accountSize;
    const dailyDrawdownUsed = Math.max(0, dayStartBalance - currentEquity);
    const dailyDrawdownRemaining = Math.max(0, dailyDrawdownLimitAmount - dailyDrawdownUsed);
    const isDailyDrawdownBreached = dailyDrawdownUsed >= dailyDrawdownLimitAmount;

    // Max Drawdown logic
    const maxDrawdownLimitAmount = (account.maxDrawdownLimit / 100) * account.accountSize;
    const drawdownFromStart = account.startingBalance - currentEquity;
    const maxDrawdownUsed = drawdownFromStart > 0 ? drawdownFromStart : 0;
    const maxDrawdownRemaining = Math.max(0, maxDrawdownLimitAmount - maxDrawdownUsed);
    const isMaxDrawdownBreached = maxDrawdownUsed >= maxDrawdownLimitAmount;

    // Equity Curve points
    let runningBalance = account.startingBalance;
    const equityCurve = [account.startingBalance, ...sortedTrades.map(t => {
        runningBalance += (t.netPnl || 0);
        return runningBalance;
    })];

    return {
        currentBalance: currentEquity,
        totalPnL,
        pnlPercentage,
        profitTargetAmount,
        profitRemaining,
        dailyDrawdownUsed,
        dailyDrawdownRemaining,
        dailyDrawdownLimitAmount,
        maxDrawdownUsed,
        maxDrawdownRemaining,
        maxDrawdownLimitAmount,
        isDailyDrawdownBreached,
        isMaxDrawdownBreached,
        isTargetMet,
        winRate,
        consecutiveLossCount,
        dailyProfit,
        dailyProfitTargetReached,
        equityCurve
    };
}


