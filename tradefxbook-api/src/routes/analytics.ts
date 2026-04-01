// src/routes/analytics.ts
// GET /api/analytics/strategy-performance  — per-strategy P&L breakdown
// GET /api/analytics/overview              — general account stats
// GET /api/analytics/daily-pnl             — daily P&L for calendar/chart
// GET /api/analytics                       — main dashboard data

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/authMiddleware';
import { queryMany, queryOne } from '../lib/db';
import type { AppEnv } from '../index';

const analytics = new Hono<AppEnv>();
analytics.use('*', authMiddleware);

// GET /api/analytics/live — real-time account summary
analytics.get('/live', async (c) => {
  const userId = c.get('userId');

  try {
    const settings = await queryOne<{ accountBalance: number; unrealizedPnl: number }>(
      c.env.DB,
      `SELECT accountBalance, unrealizedPnl FROM settings WHERE userId = ?`,
      [userId],
    );

    const stats = await queryOne<{ 
      open: number; 
      closed: number; 
      winning: number; 
      totalPnl: number; 
      totalNetPnl: number;
      totalCommission: number | null;
      totalSwap: number | null;
      avgWin: number | null;
      avgLoss: number | null;
      bestTrade: number | null;
      worstTrade: number | null;
    }>(
      c.env.DB,
      `SELECT 
         SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
         SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
         SUM(CASE WHEN status = 'CLOSED' AND pnl > 0 THEN 1 ELSE 0 END) as winning,
         SUM(pnl) as totalPnl,
         SUM(netPnl) as totalNetPnl,
         SUM(commission) as totalCommission,
         SUM(swap) as totalSwap,
         AVG(CASE WHEN pnl > 0 THEN pnl END) as avgWin,
         AVG(CASE WHEN pnl < 0 THEN pnl END) as avgLoss,
         MAX(pnl) as bestTrade,
         MIN(pnl) as worstTrade
       FROM trades WHERE userId = ?`,
      [userId],
    );

    await c.env.DB.prepare(`
      UPDATE sync_requests SET status = 'COMPLETED', updatedAt = unixepoch()
      WHERE userId = ? AND status IN ('PENDING', 'PROCESSING') AND createdAt < (unixepoch() - 120)
    `).bind(userId).run();

    const activeSync = await queryOne<{ id: string }>(
      c.env.DB,
      `SELECT id FROM sync_requests WHERE userId = ? AND status IN ('PENDING', 'PROCESSING') ORDER BY createdAt DESC LIMIT 1`,
      [userId],
    );

    const initialBalance = settings?.accountBalance ?? 0;
    const unrealizedPnl = settings?.unrealizedPnl ?? 0;
    const equity = initialBalance + unrealizedPnl;
    const closedCount = stats?.closed ?? 0;
    const winRate = closedCount > 0 ? ((stats?.winning ?? 0) / closedCount) * 100 : 0;

    return c.json({
      initialBalance,
      accountBalance: initialBalance,
      unrealizedPnl,
      equity,
      openTrades: stats?.open ?? 0,
      totalTrades: closedCount,
      totalPnl: stats?.totalPnl ?? 0,
      totalNetPnl: stats?.totalNetPnl ?? 0,
      totalCommission: stats?.totalCommission ?? 0,
      totalSwap: stats?.totalSwap ?? 0,
      winRate,
      averageWin: stats?.avgWin ?? 0,
      averageLoss: stats?.avgLoss ?? 0,
      bestTrade: stats?.bestTrade ?? 0,
      worstTrade: stats?.worstTrade ?? 0,
      isSyncing: !!activeSync,
    });
  } catch (error: any) {
    console.error("Error in /live analytics:", error);
    return c.json({ error: "Internal Server Error", details: error.message }, 500);
  }
});

// GET /api/analytics/strategy-performance
analytics.get('/strategy-performance', async (c) => {
  const userId = c.get('userId');

  try {
    const rows = await queryMany<{
      strategyId: string | null;
      strategyName: string | null;
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      totalPnl: number | null;
      totalNetPnl: number | null;
      avgPnl: number | null;
      avgRMultiple: number | null;
    }>(
      c.env.DB,
      `SELECT
         t.strategyId as strategyId,
         s.name as strategyName,
         COUNT(*) as totalTrades,
         SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END) as winningTrades,
         SUM(CASE WHEN t.pnl < 0 THEN 1 ELSE 0 END) as losingTrades,
         SUM(t.pnl) as totalPnl,
         SUM(t.netPnl) as totalNetPnl,
         AVG(t.pnl) as avgPnl,
         AVG(t.rMultiple) as avgRMultiple
       FROM trades t
       LEFT JOIN strategies s ON t.strategyId = s.id
       WHERE t.userId = ? AND t.status = 'CLOSED'
       GROUP BY t.strategyId, s.name
       ORDER BY totalPnl DESC`,
      [userId],
    );

    return c.json({
      strategies: rows.map((r) => ({
        strategyId: r.strategyId,
        strategyName: r.strategyName ?? 'No Strategy',
        totalTrades: r.totalTrades,
        winningTrades: r.winningTrades,
        losingTrades: r.losingTrades,
        winRate: r.totalTrades > 0 ? (r.winningTrades / r.totalTrades) * 100 : 0,
        totalPnl: r.totalPnl ?? 0,
        totalNetPnl: r.totalNetPnl ?? 0,
        avgPnl: r.avgPnl ?? 0,
        avgRMultiple: r.avgRMultiple ?? 0,
      })),
    });
  } catch (error: any) {
    console.error("Error in /strategy-performance analytics:", error);
    return c.json({ error: "Internal Server Error", details: error.message }, 500);
  }
});

// GET /api/analytics/overview
analytics.get('/overview', async (c) => {
  const userId = c.get('userId');

  try {
    const overview = await queryOne<{
      total: number;
      closed: number;
      open: number;
      winning: number;
      losing: number;
      totalPnl: number | null;
      totalNetPnl: number | null;
      avgPnl: number | null;
      avgR: number | null;
      bestTradePnl: number | null;
      worstTradePnl: number | null;
    }>(
      c.env.DB,
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
         SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
         SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning,
         SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing,
         SUM(pnl) as totalPnl,
         SUM(netPnl) as totalNetPnl,
         AVG(pnl) as avgPnl,
         AVG(rMultiple) as avgR,
         MAX(pnl) as bestTradePnl,
         MIN(pnl) as worstTradePnl
       FROM trades WHERE userId = ?`,
      [userId],
    );

    const monthly = await queryMany<{ month: string; pnl: number | null; trades: number }>(
      c.env.DB,
      `SELECT
         strftime('%Y-%m', datetime(entryDate, 'unixepoch')) as month,
         SUM(pnl) as pnl,
         COUNT(*) as trades
       FROM trades
       WHERE userId = ? AND status = 'CLOSED'
       GROUP BY month
       ORDER BY month ASC
       LIMIT 24`,
      [userId],
    );

    return c.json({
      overview: {
        totalTrades: overview?.total ?? 0,
        closedTrades: overview?.closed ?? 0,
        openTrades: overview?.open ?? 0,
        winningTrades: overview?.winning ?? 0,
        losingTrades: overview?.losing ?? 0,
        winRate: (overview?.closed ?? 0) > 0
          ? ((overview?.winning ?? 0) / (overview?.closed ?? 1)) * 100
          : 0,
        totalPnl: overview?.totalPnl ?? 0,
        totalNetPnl: overview?.totalNetPnl ?? 0,
        avgPnl: overview?.avgPnl ?? 0,
        avgRMultiple: overview?.avgR ?? 0,
        bestTradePnl: overview?.bestTradePnl ?? 0,
        worstTradePnl: overview?.worstTradePnl ?? 0,
      },
      monthly: monthly.map((m) => ({ month: m.month, pnl: m.pnl ?? 0, trades: m.trades })),
    });
  } catch (error: any) {
    console.error("Error in /overview analytics:", error);
    return c.json({ error: "Internal Server Error", details: error.message }, 500);
  }
});

// GET /api/analytics/daily-pnl
analytics.get('/daily-pnl', async (c) => {
  const userId = c.get('userId');
  const { dateFrom, dateTo } = c.req.query();

  try {
    let query = `
      SELECT
        strftime('%Y-%m-%d', datetime(exitDate, 'unixepoch')) as date,
        SUM(netPnl) as dayPnl,
        COUNT(*) as trades
      FROM trades
      WHERE userId = ? AND status = 'CLOSED'
    `;
    const params: any[] = [userId];

    if (dateFrom) {
      query += ` AND datetime(exitDate, 'unixepoch') >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND datetime(exitDate, 'unixepoch') <= ?`;
      params.push(dateTo);
    }

    query += ` GROUP BY date ORDER BY date ASC`;

    const rows = await queryMany<{ date: string; dayPnl: number; trades: number }>(
      c.env.DB,
      query,
      params,
    );

    let cumulative = 0;
    const result = rows.map((r) => {
      cumulative += r.dayPnl;
      return {
        date: r.date,
        pnl: r.dayPnl.toFixed(2),
        cumulativePnl: cumulative.toFixed(2),
        trades: r.trades,
      };
    });

    return c.json({ dailyPnL: result });
  } catch (error: any) {
    console.error("Error in /daily-pnl analytics:", error);
    return c.json({ error: "Internal Server Error", details: error.message }, 500);
  }
});

// GET /api/analytics (Main Dashboard & Performance Data)
analytics.get('/', async (c) => {
  const userId = c.get('userId');
  const { period, filter } = c.req.query();

  try {
    const settings = await queryOne<{ accountBalance: number; unrealizedPnl: number }>(
      c.env.DB,
      `SELECT accountBalance, unrealizedPnl FROM settings WHERE userId = ?`,
      [userId],
    );
    const initialBalance = settings?.accountBalance ?? 0;
    const unrealizedPnl = settings?.unrealizedPnl ?? 0;

    const conditions: string[] = ['userId = ?', "status = 'CLOSED'"];
    const bindings: any[] = [userId];

    if (period && period !== 'all') {
      let days = 30;
      if (period === '7d') days = 7;
      else if (period === '3m') days = 90;
      else if (period === '1y') days = 365;
      conditions.push(`datetime(exitDate, 'unixepoch') >= datetime('now', ?)`);
      bindings.push(`-${days} days`);
    }

    if (filter === 'winners') {
      conditions.push('pnl > 0');
    } else if (filter === 'losers') {
      conditions.push('pnl < 0');
    }

    const where = conditions.join(' AND ');

    const stats = await queryOne<{
      totalCount: number;
      winningTrades: number;
      losingTrades: number;
      totalPnl: number;
      totalNetPnl: number;
      grossProfit: number;
      grossLoss: number;
      avgWinner: number;
      avgLoser: number;
      maxPnl: number;
      minPnl: number;
    }>(
      c.env.DB,
      `SELECT
         COUNT(*) as totalCount,
         SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winningTrades,
         SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losingTrades,
         SUM(pnl) as totalPnl,
         SUM(netPnl) as totalNetPnl,
         SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as grossProfit,
         SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) as grossLoss,
         AVG(CASE WHEN pnl > 0 THEN pnl END) as avgWinner,
         AVG(CASE WHEN pnl < 0 THEN pnl END) as avgLoser,
         MAX(pnl) as maxPnl,
         MIN(pnl) as minPnl
       FROM trades
       WHERE ${where}`,
      bindings,
    );

    const dailyRows = await queryMany<{ date: string; pnl: number; tradesCount: number }>(
      c.env.DB,
      `SELECT
         strftime('%Y-%m-%d', datetime(exitDate, 'unixepoch')) as date,
         SUM(netPnl) as pnl,
         COUNT(*) as tradesCount
       FROM trades
       WHERE ${where}
       GROUP BY date
       ORDER BY date ASC`,
      bindings,
    );

    let runningEquity = initialBalance;
    const equityCurve = dailyRows.map((r) => {
      runningEquity += r.pnl;
      return {
        date: r.date,
        equity: runningEquity,
        pnl: r.pnl,
      };
    });

    const recentTradesRows = await queryMany<any>(
      c.env.DB,
      `SELECT * FROM trades WHERE userId = ? ORDER BY exitDate DESC LIMIT 500`,
      [userId],
    );

    const winRate = (stats?.totalCount ?? 0) > 0 ? ((stats?.winningTrades ?? 0) / stats!.totalCount) * 100 : 0;
    const profitFactor = Math.abs(stats?.grossLoss ?? 0) > 0 ? (stats?.grossProfit ?? 0) / Math.abs(stats!.grossLoss) : (stats?.grossProfit ?? 0) > 0 ? Infinity : 0;
    const expectancy = (stats?.totalCount ?? 0) > 0 ? (stats?.totalPnl ?? 0) / stats!.totalCount : 0;

    const allClosed = await queryMany<{ pnl: number }>(
      c.env.DB,
      `SELECT pnl FROM trades WHERE userId = ? AND status = 'CLOSED' ORDER BY exitDate ASC`,
      [userId]
    );
    
    let maxWinStreak = 0, maxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
    for (const t of allClosed) {
      if (t.pnl > 0) {
        currentWinStreak++; currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (t.pnl < 0) {
        currentLossStreak++; currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    }

    const rrRatio = Math.abs(stats?.avgLoser ?? 0) > 0 ? (stats?.avgWinner ?? 0) / Math.abs(stats!.avgLoser) : 0;

    const openTradesCount = await queryOne<{ cnt: number }>(
      c.env.DB,
      "SELECT COUNT(*) as cnt FROM trades WHERE userId = ? AND status = 'OPEN'",
      [userId]
    );

    const monthlyRows = await queryMany<{ month: string; pnl: number; tradesCount: number }>(
      c.env.DB,
      `SELECT
         strftime('%Y-%m', datetime(exitDate, 'unixepoch')) as month,
         SUM(netPnl) as pnl,
         COUNT(*) as tradesCount
       FROM trades
       WHERE userId = ? AND status = 'CLOSED'
       GROUP BY month
       ORDER BY month ASC`,
      [userId],
    );

    // 9. Day of Week Performance
    const dayOfWeekRows = await queryMany<{ dayIndex: number; pnl: number; tradesCount: number; wins: number }>(
      c.env.DB,
      `SELECT
         CAST(strftime('%w', datetime(exitDate, 'unixepoch')) AS INTEGER) as dayIndex,
         SUM(netPnl) as pnl,
         COUNT(*) as tradesCount,
         SUM(CASE WHEN netPnl > 0 THEN 1 ELSE 0 END) as wins
       FROM trades
       WHERE ${where}
       GROUP BY dayIndex`,
      bindings,
    );

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekPerformance = dayNames.map((name, index) => {
      const row = dayOfWeekRows.find(r => r.dayIndex === index);
      return {
        day: name,
        pnl: row?.pnl ?? 0,
        trades: row?.tradesCount ?? 0,
        winRate: (row?.tradesCount ?? 0) > 0 ? (row!.wins / row!.tradesCount) * 100 : 0
      };
    });

    // 10. Long/Short Performance
    const longShortRows = await queryMany<{ type: string; pnl: number; tradesCount: number; wins: number; bestTrade: number }>(
      c.env.DB,
      `SELECT
         type,
         SUM(netPnl) as pnl,
         COUNT(*) as tradesCount,
         SUM(CASE WHEN netPnl > 0 THEN 1 ELSE 0 END) as wins,
         MAX(netPnl) as bestTrade
       FROM trades
       WHERE ${where}
       GROUP BY type`,
      bindings,
    );

    const longStats = longShortRows.find(r => r.type === 'BUY' || r.type === 'LONG');
    const shortStats = longShortRows.find(r => r.type === 'SELL' || r.type === 'SHORT');

    const longShortPerformance = {
      long: {
        wins: longStats?.wins ?? 0,
        losses: (longStats?.tradesCount ?? 0) - (longStats?.wins ?? 0),
        pnl: longStats?.pnl ?? 0,
        trades: longStats?.tradesCount ?? 0,
        winRate: (longStats?.tradesCount ?? 0) > 0 ? (longStats!.wins / longStats!.tradesCount) * 100 : 0,
        bestTrade: longStats?.bestTrade ?? 0
      },
      short: {
        wins: shortStats?.wins ?? 0,
        losses: (shortStats?.tradesCount ?? 0) - (shortStats?.wins ?? 0),
        pnl: shortStats?.pnl ?? 0,
        trades: shortStats?.tradesCount ?? 0,
        winRate: (shortStats?.tradesCount ?? 0) > 0 ? (shortStats!.wins / shortStats!.tradesCount) * 100 : 0,
        bestTrade: shortStats?.bestTrade ?? 0
      }
    };

    // 11. Session Performance (UTC)
    const sessionRows = await queryMany<{ session: string; pnl: number; tradesCount: number; wins: number }>(
      c.env.DB,
      `SELECT
         CASE
           WHEN CAST(strftime('%H', datetime(entryDate, 'unixepoch')) AS INTEGER) >= 22 OR CAST(strftime('%H', datetime(entryDate, 'unixepoch')) AS INTEGER) < 8 THEN 'Asian'
           WHEN CAST(strftime('%H', datetime(entryDate, 'unixepoch')) AS INTEGER) >= 8 AND CAST(strftime('%H', datetime(entryDate, 'unixepoch')) AS INTEGER) < 13 THEN 'London'
           WHEN CAST(strftime('%H', datetime(entryDate, 'unixepoch')) AS INTEGER) >= 13 AND CAST(strftime('%H', datetime(entryDate, 'unixepoch')) AS INTEGER) < 22 THEN 'New York'
           ELSE 'Other'
         END as session,
         SUM(netPnl) as pnl,
         COUNT(*) as tradesCount,
         SUM(CASE WHEN netPnl > 0 THEN 1 ELSE 0 END) as wins
       FROM trades
       WHERE ${where}
       GROUP BY session`,
      bindings,
    );

    const sessionPerformance = ['Asian', 'London', 'New York'].map(name => {
      const row = sessionRows.find(r => r.session === name);
      return {
        session: name,
        pnl: row?.pnl ?? 0,
        trades: row?.tradesCount ?? 0,
        winRate: (row?.tradesCount ?? 0) > 0 ? (row!.wins / row!.tradesCount) * 100 : 0
      };
    });

    return c.json({
      initialBalance,
      unrealizedPnl,
      totalTrades: stats?.totalCount ?? 0,
      winningTrades: stats?.winningTrades ?? 0,
      losingTrades: stats?.losingTrades ?? 0,
      winRate,
      grossProfit: (stats?.grossProfit ?? 0).toFixed(2),
      grossLoss: (stats?.grossLoss ?? 0).toFixed(2),
      totalPnl: (stats?.totalPnl ?? 0).toFixed(2),
      totalNetPnl: (stats?.totalNetPnl ?? 0).toFixed(2),
      avgWinner: (stats?.avgWinner ?? 0).toFixed(2),
      avgLoser: (stats?.avgLoser ?? 0).toFixed(2),
      profitFactor,
      expectancy,
      bestTrade: (stats?.maxPnl ?? 0).toFixed(2),
      worstTrade: (stats?.minPnl ?? 0).toFixed(2),
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
      riskRewardRatio: rrRatio.toFixed(2),
      openTrades: openTradesCount?.cnt ?? 0,
      equityCurve: equityCurve.map(e => ({
        ...e,
        time: e.date,
        value: e.equity,
        drawdown: 0
      })),
      dailyPnL: dailyRows.map(r => ({ date: r.date, pnl: r.pnl, trades: r.tradesCount })),
      trades: recentTradesRows,
      monthlyStats: monthlyRows.map(m => ({ 
        month: m.month, 
        profit: m.pnl, 
        trades: m.tradesCount 
      })),
      sessionPerformance,
      dayOfWeekPerformance,
      longShortPerformance
    });
  } catch (error: any) {
    console.error("Error in comprehensive analytics:", error);
    return c.json({ error: "Internal Server Error", details: error.message }, 500);
  }
});

export default analytics;
