// src/routes/tradeById.ts
// GET    /api/trades/:id
// PUT    /api/trades/:id
// DELETE /api/trades/:id

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryOne, queryMany, execute, toUnix, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

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
  exitPrice:         z.number().optional(),
  exitDate:          z.string().optional(),
  stopLoss:          z.number().optional(),
  takeProfit:        z.number().optional(),
  commission:        z.number().optional(),
  swap:              z.number().optional(),
  fees:              z.number().optional(),
  status:            z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).optional(),
  strategyId:        z.string().nullable().optional(),
  setupType:         z.string().optional(),
  marketCondition:   z.string().optional(),
  entryEmotion:      z.string().optional(),
  exitEmotion:       z.string().optional(),
  preTradeAnalysis:  z.string().optional(),
  postTradeAnalysis: z.string().optional(),
  lessonsLearned:    z.string().optional(),
  rating:            z.number().int().min(1).max(5).optional(),
  tagIds:            z.array(z.string()).optional(),
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

  const map: Record<string, string> = {
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
      if (key === 'exitDate' && typeof val === 'string') val = toUnix(val);
      fields.push(`${col} = ?`);
      vals.push(val);
    }
  }

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
