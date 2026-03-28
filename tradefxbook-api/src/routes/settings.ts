// src/routes/settings.ts
// GET /api/settings  — fetch user settings
// PUT /api/settings  — update user settings

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryOne, execute, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const settings = new Hono<AppEnv>();
settings.use('*', authMiddleware);

function serialize(row: Record<string, unknown>) {
  return {
    id: row.id, userId: row.userId,
    accountBalance: row.accountBalance,
    unrealizedPnl: row.unrealizedPnl,
    theme: row.theme, currency: row.currency, dateFormat: row.dateFormat,
    timezone: row.timezone, defaultTradeView: row.defaultTradeView,
    tradesPerPage: row.tradesPerPage,
    showClosedTrades: row.showClosedTrades === 1,
    showOpenTrades: row.showOpenTrades === 1,
    defaultDashboardView: row.defaultDashboardView,
    favoriteSymbols: (row.favoriteSymbols as string)?.split(',').filter(Boolean) ?? [],
    emailNotifications: row.emailNotifications === 1,
    tradeAlerts: row.tradeAlerts === 1,
    weeklyReports: row.weeklyReports === 1,
    publicProfile: row.publicProfile === 1,
    shareAnalytics: row.shareAnalytics === 1,
    showOnLeaderboard: row.showOnLeaderboard === 1,
    showTrades: row.showTrades === 1,
    showPnlPerTrade: row.showPnlPerTrade === 1,
    showTotalPnl: row.showTotalPnl === 1,
    showWinRate: row.showWinRate === 1,
    showTradeCount: row.showTradeCount === 1,
    pushNotifications: row.pushNotifications === 1,
    createdAt: fromUnix(row.createdAt as number),
    updatedAt: fromUnix(row.updatedAt as number),
  };
}

settings.get('/', async (c) => {
  const userId = c.get('userId');
  let row = await queryOne<Record<string, unknown>>(
    c.env.DB, 'SELECT * FROM settings WHERE userId = ?', [userId],
  );
  // Auto-create if missing
  if (!row) {
    const id = generateId();
    const now = Math.floor(Date.now() / 1000);
    await execute(c.env.DB,
      'INSERT OR IGNORE INTO settings (id, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [id, userId, now, now],
    );
    row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM settings WHERE userId = ?', [userId]);
  }
  return c.json(serialize(row!));
});

const updateSchema = z.object({
  accountBalance:       z.number().optional(),
  unrealizedPnl:        z.number().optional(),
  theme:                z.enum(['dark', 'light', 'system']).optional(),
  currency:             z.string().optional(),
  dateFormat:           z.string().optional(),
  timezone:             z.string().optional(),
  defaultTradeView:     z.enum(['list', 'grid', 'calendar']).optional(),
  tradesPerPage:        z.number().int().min(5).max(100).optional(),
  showClosedTrades:     z.boolean().optional(),
  showOpenTrades:       z.boolean().optional(),
  defaultDashboardView: z.string().optional(),
  favoriteSymbols:      z.array(z.string()).optional(),
  emailNotifications:   z.boolean().optional(),
  tradeAlerts:          z.boolean().optional(),
  weeklyReports:        z.boolean().optional(),
  publicProfile:        z.boolean().optional(),
  shareAnalytics:       z.boolean().optional(),
  showOnLeaderboard:    z.boolean().optional(),
  showTrades:           z.boolean().optional(),
  showPnlPerTrade:      z.boolean().optional(),
  showTotalPnl:         z.boolean().optional(),
  showWinRate:          z.boolean().optional(),
  showTradeCount:       z.boolean().optional(),
  pushNotifications:    z.boolean().optional(),
});

settings.put('/', async (c) => {
  const userId = c.get('userId');
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  const d = parsed.data;

  const now = Math.floor(Date.now() / 1000);
  const colMap: Record<string, string> = {
    accountBalance: 'accountBalance', theme: 'theme', currency: 'currency',
    dateFormat: 'dateFormat', timezone: 'timezone', defaultTradeView: 'defaultTradeView',
    tradesPerPage: 'tradesPerPage', showClosedTrades: 'showClosedTrades',
    showOpenTrades: 'showOpenTrades', defaultDashboardView: 'defaultDashboardView',
    emailNotifications: 'emailNotifications', tradeAlerts: 'tradeAlerts',
    unrealizedPnl: 'unrealizedPnl',
    weeklyReports: 'weeklyReports', publicProfile: 'publicProfile',
    shareAnalytics: 'shareAnalytics', showOnLeaderboard: 'showOnLeaderboard',
    showTrades: 'showTrades', showPnlPerTrade: 'showPnlPerTrade',
    showTotalPnl: 'showTotalPnl', showWinRate: 'showWinRate',
    showTradeCount: 'showTradeCount', pushNotifications: 'pushNotifications',
  };

  const fields: string[] = ['updatedAt = ?'];
  const vals: unknown[] = [now];

  for (const [key, col] of Object.entries(colMap)) {
    const val = (d as Record<string, unknown>)[key];
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      vals.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
    }
  }

  // favoriteSymbols → comma-separated string
  if (d.favoriteSymbols !== undefined) {
    fields.push('favoriteSymbols = ?');
    vals.push(d.favoriteSymbols.join(','));
  }

  await execute(c.env.DB, `UPDATE settings SET ${fields.join(', ')} WHERE userId = ?`, [...vals, userId]);
  const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM settings WHERE userId = ?', [userId]);
  return c.json(serialize(row!));
});

export default settings;
