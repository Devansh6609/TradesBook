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
    // 1. Get balance/equity from settings
    const settings = await queryOne<{ accountBalance: number; unrealizedPnl: number }>(
      c.env.DB,
      `SELECT accountBalance, unrealizedPnl FROM settings WHERE userId = ?`,
      [userId],
    );

    // 2. Get trade counts/stats
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

    // Auto-expire stale sync_requests older than 2 minutes so the banner doesn't stay stuck
    await c.env.DB.prepare(`
      UPDATE sync_requests SET status = 'COMPLETED', updatedAt = unixepoch()
      WHERE userId = ? AND status IN ('PENDING', 'PROCESSING') AND createdAt < (unixepoch() - 120)
    `).bind(userId).run();

    // 3. Check if there's a *recent* (under 2 min) sync in progress
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
      accountBalance: initialBalance, // Legacy compatibility
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

    // Monthly P&L for chart
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

    // Calculate cumulative P&L
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

// GET /api/analytics (Main Dashboard Chart)
analytics.get('/', async (c) => {
  const userId = c.get('userId');
  const { period } = c.req.query();

  try {
    // 1. Get initial balance and unrealized P&L from settings
    const settings = await queryOne<{ accountBalance: number; unrealizedPnl: number }>(
      c.env.DB,
      `SELECT accountBalance, unrealizedPnl FROM settings WHERE userId = ?`,
      [userId],
    );
    const initialBalance = settings?.accountBalance ?? 0;
    const unrealizedPnlTotal = settings?.unrealizedPnl ?? 0;

    // 2. Get daily P&L for period
    let dateFilter = '';
    const params: any[] = [userId];

    if (period && period !== 'all') {
      let days = 30;
      if (period === '7d') days = 7;
      else if (period === '3m') days = 90;
      else if (period === '1y') days = 365;

      dateFilter = ` AND datetime(exitDate, 'unixepoch') >= datetime('now', ?)`;
      params.push(`-${days} days`);
    }

    const query = `
      SELECT
        strftime('%Y-%m-%d', datetime(exitDate, 'unixepoch')) as date,
        SUM(netPnl) as dayPnl,
        COUNT(*) as trades
      FROM trades
      WHERE userId = ? AND status = 'CLOSED'
      ${dateFilter}
      GROUP BY date
      ORDER BY date ASC
    `;

    const rows = await queryMany<{ date: string; dayPnl: number; trades: number }>(
      c.env.DB,
      query,
      params,
    );

    let cumulative = 0;
    const dailyPnL = rows.map((r) => {
      cumulative += r.dayPnl;
      return {
        date: r.date,
        pnl: r.dayPnl.toFixed(2),
        cumulativePnl: cumulative.toFixed(2),
        trades: r.trades,
      };
    });

    return c.json({
      initialBalance,
      unrealizedPnl: unrealizedPnlTotal,
      dailyPnL,
    });
  } catch (error: any) {
    console.error("Error in /main analytics:", error);
    return c.json({ error: "Internal Server Error", details: error.message }, 500);
  }
});

export default analytics;
