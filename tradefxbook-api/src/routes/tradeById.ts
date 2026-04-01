// src/routes/tradeById.ts
// GET    /api/trades/:id
// PUT    /api/trades/:id
// DELETE /api/trades/:id

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryOne, queryMany, execute, toUnix, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';
import { calculatePnL } from './trades';

const tradeById = new Hono<AppEnv>();
tradeById.use('*', authMiddleware);

function serializeTrade(row: Record<string, unknown>) {
  return {
    id: row.id, userId: row.userId, accountId: row.accountId,
    ticketId: row.ticketId, symbol: row.symbol, type: row.type,
    entryPrice: row.entryPrice, exitPrice: row.exitPrice,
    entryDate: fromUnix(row.entryDate as number),
    exitDate: fromUnix(row.exitDate as number | null),
    quantity: row.quantity, stopLoss: row.stopLoss, takeProfit: row.takeProfit,
    pnl: row.pnl, pnlPercentage: row.pnlPercentage,
    commission: row.commission, swap: row.swap, fees: row.fees,
    netPnl: row.netPnl, riskAmount: row.riskAmount, riskPercentage: row.riskPercentage,
    rMultiple: row.rMultiple, status: row.status, strategyId: row.strategyId,
    setupType: row.setupType, marketCondition: row.marketCondition,
    entryEmotion: row.entryEmotion, exitEmotion: row.exitEmotion,
    preTradeAnalysis: row.preTradeAnalysis, postTradeAnalysis: row.postTradeAnalysis,
    lessonsLearned: row.lessonsLearned, rating: row.rating,
    createdAt: fromUnix(row.createdAt as number), updatedAt: fromUnix(row.updatedAt as number),
  };
}

// GET /api/trades/:id
tradeById.get('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const trade = await queryOne<Record<string, unknown>>(
    c.env.DB, 'SELECT * FROM trades WHERE id = ? AND userId = ?', [id, userId],
  );
  if (!trade) return c.json({ error: 'Trade not found' }, 404);

  const [tags, screenshots, partialCloses] = await Promise.all([
    queryMany<{ tagId: string; name: string; color: string }>(
      c.env.DB,
      'SELECT tt.tagId, tg.name, tg.color FROM trade_tags tt JOIN tags tg ON tt.tagId = tg.id WHERE tt.tradeId = ?',
      [id],
    ),
    queryMany<{ id: string; url: string; caption: string | null; chartType: string | null }>(
      c.env.DB, 'SELECT id, url, caption, chartType FROM screenshots WHERE tradeId = ?', [id],
    ),
    queryMany<{ id: string; quantity: number; exitPrice: number; pnl: number | null; closedAt: number; notes: string | null }>(
      c.env.DB, 'SELECT id, quantity, exitPrice, pnl, closedAt, notes FROM partial_closes WHERE tradeId = ? ORDER BY closedAt DESC', [id],
    ),
  ]);

  return c.json({
    ...serializeTrade(trade),
    tags: tags.map(t => ({ id: t.tagId, name: t.name, color: t.color })),
    screenshots: screenshots.map(s => ({ id: s.id, key: s.url, url: s.url, caption: s.caption, chartType: s.chartType })),
    partialCloses: partialCloses.map(pc => ({ id: pc.id, quantity: pc.quantity, exitPrice: pc.exitPrice, pnl: pc.pnl, closedAt: fromUnix(pc.closedAt), notes: pc.notes })),
  });
});

// PUT /api/trades/:id
const updateSchema = z.object({
  symbol:            z.string().optional(),
  type:              z.enum(['BUY', 'SELL']).optional(),
  entryPrice:        z.number().optional(),
  entryDate:         z.string().optional(),
  exitPrice:         z.number().optional().nullable(),
  exitDate:          z.string().optional().nullable(),
  quantity:          z.number().optional(),
  stopLoss:          z.number().optional().nullable(),
  takeProfit:        z.number().optional().nullable(),
  commission:        z.number().optional(),
  swap:              z.number().optional(),
  fees:              z.number().optional(),
  status:            z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).optional(),
  strategyId:        z.string().optional().nullable().transform(v => v === '' ? null : v),
  setupType:         z.string().optional().nullable(),
  marketCondition:   z.enum(['TRENDING_UP','TRENDING_DOWN','RANGING','VOLATILE','BREAKOUT','REVERSAL']).optional().nullable(),
  entryEmotion:      z.enum(['CONFIDENT','FEARFUL','GREEDY','IMPATIENT','NEUTRAL','FRUSTRATED','EXCITED','CAUTIOUS']).optional().nullable(),
  exitEmotion:       z.enum(['CONFIDENT','FEARFUL','GREEDY','IMPATIENT','NEUTRAL','FRUSTRATED','EXCITED','CAUTIOUS']).optional().nullable(),
  preTradeAnalysis:  z.string().optional().nullable(),
  postTradeAnalysis: z.string().optional().nullable(),
  lessonsLearned:    z.string().optional().nullable(),
  rating:            z.number().int().min(1).max(5).optional().nullable(),
  tagIds:            z.array(z.string()).optional().transform(v => v?.filter(id => id !== '')),
});

tradeById.put('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const trade = await queryOne<Record<string, unknown>>(
    c.env.DB, 'SELECT * FROM trades WHERE id = ? AND userId = ?', [id, userId],
  );
  if (!trade) return c.json({ error: 'Trade not found' }, 404);

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  const d = parsed.data;

  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = ['updatedAt = ?'];
  const vals: unknown[] = [now];

  // Merge current trade with updates for recalculation
  const merged = {
    symbol: d.symbol ?? (trade.symbol as string),
    type: d.type ?? (trade.type as 'BUY' | 'SELL'),
    entryPrice: d.entryPrice ?? (trade.entryPrice as number),
    exitPrice: d.exitPrice !== undefined ? d.exitPrice : (trade.exitPrice as number | null),
    quantity: d.quantity ?? (trade.quantity as number),
    commission: d.commission ?? (trade.commission as number),
    swap: d.swap ?? (trade.swap as number),
    fees: d.fees ?? (trade.fees as number),
    stopLoss: d.stopLoss !== undefined ? d.stopLoss : (trade.stopLoss as number | null),
  };

  // Recalculate P&L if relevant fields changed
  let pnl = trade.pnl as number;
  let pnlPct = trade.pnlPercentage as number;
  let netPnl = trade.netPnl as number;
  let rMultiple = trade.rMultiple as number | null;

  if (merged.exitPrice !== null) {
    const calc = calculatePnL(
      merged.type,
      merged.entryPrice,
      merged.exitPrice,
      merged.quantity,
      merged.symbol,
      merged.commission,
      merged.swap,
      merged.fees,
      merged.stopLoss
    );
    pnl = calc.pnl;
    pnlPct = calc.pnlPercentage;
    netPnl = calc.netPnL;
    rMultiple = calc.rMultiple;
  }

  const map: Record<string, string> = {
    symbol: 'symbol', type: 'type', entryPrice: 'entryPrice', entryDate: 'entryDate',
    exitPrice: 'exitPrice', exitDate: 'exitDate', stopLoss: 'stopLoss',
    takeProfit: 'takeProfit', commission: 'commission', swap: 'swap', fees: 'fees',
    status: 'status', strategyId: 'strategyId', setupType: 'setupType',
    marketCondition: 'marketCondition', entryEmotion: 'entryEmotion',
    exitEmotion: 'exitEmotion', preTradeAnalysis: 'preTradeAnalysis',
    postTradeAnalysis: 'postTradeAnalysis', lessonsLearned: 'lessonsLearned',
    rating: 'rating',
  };

  for (const [key, col] of Object.entries(map)) {
    if (key in d && (d as Record<string, unknown>)[key] !== undefined) {
      let val: unknown = (d as Record<string, unknown>)[key];
      if ((key === 'exitDate' || key === 'entryDate') && typeof val === 'string') val = toUnix(val);
      fields.push(`${col} = ?`);
      vals.push(val);
    }
  }

  // Also push calculated fields
  fields.push('pnl = ?', 'pnlPercentage = ?', 'netPnl = ?', 'rMultiple = ?');
  vals.push(pnl, pnlPct, netPnl, rMultiple);

  await execute(c.env.DB, `UPDATE trades SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);

  // Update tags if provided
  if (d.tagIds !== undefined) {
    await execute(c.env.DB, 'DELETE FROM trade_tags WHERE tradeId = ?', [id]);
    for (const tagId of d.tagIds) {
      await execute(c.env.DB, 'INSERT OR IGNORE INTO trade_tags (id, tradeId, tagId) VALUES (?, ?, ?)', [generateId(), id, tagId]);
    }
  }

  const updated = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM trades WHERE id = ?', [id]);
  return c.json(serializeTrade(updated!));
});

// DELETE /api/trades/:id
tradeById.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const trade = await queryOne(c.env.DB, 'SELECT id FROM trades WHERE id = ? AND userId = ?', [id, userId]);
  if (!trade) return c.json({ error: 'Trade not found' }, 404);

  await execute(c.env.DB, 'DELETE FROM trades WHERE id = ?', [id]);
  return c.json({ message: 'Trade deleted successfully' });
});

export default tradeById;
