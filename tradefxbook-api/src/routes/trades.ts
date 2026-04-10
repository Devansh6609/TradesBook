// src/routes/trades.ts
// GET  /api/trades  — paginated, filtered trade list + stats
// POST /api/trades  — create a new trade

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryMany, queryOne, execute, toUnix, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const trades = new Hono<AppEnv>();
trades.use('*', authMiddleware);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function calculatePnL(
  type: 'BUY' | 'SELL',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  symbol: string,
  commission = 0,
  swap = 0,
  fees = 0,
  stopLoss?: number | null,
): { pnl: number; netPnL: number; pnlPercentage: number; rMultiple: number | null } {
  const upper = symbol.toUpperCase();
  let contractSize = 100_000;
  
  if (upper.includes('XAU') || upper.includes('GOLD')) contractSize = 100;
  else if (upper.includes('XAG') || upper.includes('SILVER')) contractSize = 5000;
  else if (upper.includes('WTI') || upper.includes('BRENT') || upper.includes('OIL')) contractSize = 1000;
  else if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('US30') || upper.includes('NAS')) contractSize = 1;

  const priceDiff = type === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
  let pnl: number;

  // JPY-quoted pairs: divide by exitPrice
  if (upper.includes('JPY')) {
    pnl = (priceDiff * quantity * 100000) / exitPrice;
  }
  // USD-base pairs (e.g., USDCHF): divide by exitPrice
  else if (upper.startsWith('USD') && !upper.endsWith('USD')) {
    pnl = (priceDiff * quantity * 100000) / exitPrice;
  }
  // Standard (Metals, USD-quoted, etc.)
  else {
    pnl = priceDiff * quantity * contractSize;
  }

  const totalCosts = commission + swap + fees;
  const netPnL = pnl - totalCosts;

  const positionValue = entryPrice * quantity;
  const pnlPercentage = positionValue > 0 ? (pnl / positionValue) * 100 : 0;

  let rMultiple: number | null = null;
  if (stopLoss != null && stopLoss !== 0 && entryPrice !== stopLoss) {
    const riskDiff = Math.abs(entryPrice - stopLoss);
    let riskAmount: number;
    
    if (upper.includes('JPY') || (upper.startsWith('USD') && !upper.endsWith('USD'))) {
      riskAmount = (riskDiff * quantity * 100000) / exitPrice;
    } else {
      riskAmount = riskDiff * quantity * contractSize;
    }
    
    rMultiple = riskAmount > 0 ? pnl / riskAmount : null;
  }

  return { pnl, netPnL, pnlPercentage, rMultiple };
}

function serializeTrade(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    ticketId: row.ticketId,
    symbol: row.symbol,
    type: row.type,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    entryDate: fromUnix(row.entryDate as number),
    exitDate: fromUnix(row.exitDate as number | null),
    quantity: row.quantity,
    stopLoss: row.stopLoss,
    takeProfit: row.takeProfit,
    pnl: row.pnl,
    pnlPercentage: row.pnlPercentage,
    commission: row.commission,
    swap: row.swap,
    fees: row.fees,
    netPnl: row.netPnl,
    riskAmount: row.riskAmount,
    riskPercentage: row.riskPercentage,
    rMultiple: row.rMultiple,
    status: row.status,
    strategyId: row.strategyId,
    setupType: row.setupType,
    marketCondition: row.marketCondition,
    entryEmotion: row.entryEmotion,
    exitEmotion: row.exitEmotion,
    preTradeAnalysis: row.preTradeAnalysis,
    postTradeAnalysis: row.postTradeAnalysis,
    lessonsLearned: row.lessonsLearned,
    rating: row.rating,
    createdAt: fromUnix(row.createdAt as number),
    updatedAt: fromUnix(row.updatedAt as number),
  };
}

// ─── GET /api/trades ─────────────────────────────────────────────────────────
// Helper to coerce empty string → undefined before enum parsing
const emptyToUndefined = z.string().optional().transform((v) => (v === '' ? undefined : v));

const querySchema = z.object({
  page:         z.string().optional().default('1'),
  limit:        z.string().optional().default('25'),
  symbol:       emptyToUndefined,
  status:       emptyToUndefined.pipe(z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).optional()),
  type:         emptyToUndefined.pipe(z.enum(['BUY', 'SELL']).optional()),
  strategyId:   emptyToUndefined,
  dateFrom:     emptyToUndefined,
  dateTo:       emptyToUndefined,
  exitDateFrom: emptyToUndefined,
  exitDateTo:   emptyToUndefined,
  minPnl:       emptyToUndefined,
  maxPnl:       emptyToUndefined,
  pnlFilter:    z.enum(['positive', 'negative']).optional(),
  sortBy:       emptyToUndefined.pipe(z.enum(['entryDate', 'exitDate', 'pnl', 'symbol', 'createdAt']).optional()).transform((v) => v ?? 'entryDate'),
  sortOrder:    emptyToUndefined.pipe(z.enum(['asc', 'desc']).optional()).transform((v) => v ?? 'desc'),
});

trades.get('/', async (c) => {
  const userId = c.get('userId');
  const raw = Object.fromEntries(new URL(c.req.url).searchParams);
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
  const p = parsed.data;

  const page = parseInt(p.page);
  const limit = Math.min(parseInt(p.limit), 100);
  const offset = (page - 1) * limit;

  // Build WHERE clauses dynamically
  const conditions: string[] = ['t.userId = ?'];
  const bindings: unknown[] = [userId];

  if (p.symbol)     { conditions.push("t.symbol LIKE ?"); bindings.push(`%${p.symbol.toUpperCase()}%`); }
  if (p.status)     { conditions.push("t.status = ?");    bindings.push(p.status); }
  if (p.type)       { conditions.push("t.type = ?");      bindings.push(p.type); }
  if (p.strategyId) { conditions.push("t.strategyId = ?"); bindings.push(p.strategyId); }
  if (p.dateFrom)   { conditions.push("t.entryDate >= ?"); bindings.push(toUnix(p.dateFrom)); }
  if (p.dateTo)     { conditions.push("t.entryDate <= ?"); bindings.push(toUnix(p.dateTo)); }
  if (p.exitDateFrom) { conditions.push("t.exitDate >= ?"); bindings.push(toUnix(p.exitDateFrom)); }
  if (p.exitDateTo)   { conditions.push("t.exitDate <= ?"); bindings.push(toUnix(p.exitDateTo)); }
  if (p.minPnl !== undefined) { conditions.push("t.pnl >= ?"); bindings.push(parseFloat(p.minPnl)); }
  if (p.maxPnl !== undefined) { conditions.push("t.pnl <= ?"); bindings.push(parseFloat(p.maxPnl)); }

  const where = conditions.join(' AND ');
  const orderCol = ['entryDate','exitDate','pnl','symbol','createdAt'].includes(p.sortBy) ? p.sortBy : 'entryDate';
  const orderDir = p.sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Count total
  const countRow = await queryOne<{ cnt: number }>(
    c.env.DB,
    `SELECT COUNT(*) as cnt FROM trades t WHERE ${where}`,
    bindings,
  );
  const total = countRow?.cnt ?? 0;

  // Fetch trades
  const rows = await queryMany<Record<string, unknown>>(
    c.env.DB,
    `SELECT t.*, s.name as strategy_name
     FROM trades t
     LEFT JOIN strategies s ON t.strategyId = s.id
     WHERE ${where}
     ORDER BY t.${orderCol} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...bindings, limit, offset],
  );

  // Tags and screenshots for fetched trades
  const tradeIds = rows.map((r) => r.id as string);
  let tagsMap: Record<string, unknown[]> = {};
  let screenshotsMap: Record<string, unknown[]> = {};

  if (tradeIds.length > 0) {
    const placeholders = tradeIds.map(() => '?').join(',');
    const tagRows = await queryMany<{ tradeId: string; tagId: string; name: string; color: string }>(
      c.env.DB,
      `SELECT tt.tradeId, tt.tagId, tg.name, tg.color
       FROM trade_tags tt JOIN tags tg ON tt.tagId = tg.id
       WHERE tt.tradeId IN (${placeholders})`,
      tradeIds,
    );
    tagRows.forEach((tr) => {
      if (!tagsMap[tr.tradeId]) tagsMap[tr.tradeId] = [];
      tagsMap[tr.tradeId].push({ id: tr.tagId, name: tr.name, color: tr.color });
    });

    const ssRows = await queryMany<{ id: string; tradeId: string; url: string; caption: string | null }>(
      c.env.DB,
      `SELECT id, tradeId, url, caption FROM screenshots WHERE tradeId IN (${placeholders})`,
      tradeIds,
    );
    ssRows.forEach((s) => {
      if (!screenshotsMap[s.tradeId]) screenshotsMap[s.tradeId] = [];
      screenshotsMap[s.tradeId].push({ id: s.id, url: s.url, caption: s.caption });
    });
  }

  // Stats (all user trades, not just current page)
  const stats = await queryOne<{ 
    total: number; 
    winning: number; 
    losing: number; 
    totalPnl: number | null; 
    totalNetPnl: number | null;
    avgPips: number | null;
    dailyProfit: number | null;
  }>(
    c.env.DB,
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'CLOSED' AND pnl > 0 THEN 1 ELSE 0 END) as winning,
       SUM(CASE WHEN status = 'CLOSED' AND pnl < 0 THEN 1 ELSE 0 END) as losing,
       SUM(pnl) as totalPnl,
       SUM(netPnl) as totalNetPnl,
       AVG(CASE 
         WHEN status = 'CLOSED' AND symbol LIKE '%JPY%' THEN (exitPrice - entryPrice) * 100
         WHEN status = 'CLOSED' AND (symbol LIKE '%XAU%' OR symbol LIKE '%GOLD%') THEN (exitPrice - entryPrice) * 10
         WHEN status = 'CLOSED' THEN (exitPrice - entryPrice) * 10000
         ELSE NULL
       END) as avgPips,
       SUM(CASE WHEN status = 'CLOSED' AND strftime('%Y-%m-%d', datetime(exitDate, 'unixepoch')) = strftime('%Y-%m-%d', 'now') THEN netPnl ELSE 0 END) as dailyProfit
     FROM trades WHERE userId = ?`,
    [userId],
  );

  const totalTrades = stats?.total ?? 0;
  const winningTrades = stats?.winning ?? 0;
  const losingTrades = stats?.losing ?? 0;
  // Win rate is usually based on closed trades
  const closedTrades = winningTrades + losingTrades;
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

  return c.json({
    trades: rows.map((row) => ({
      ...serializeTrade(row),
      strategy: row.strategyId ? { id: row.strategyId as string, name: row.strategy_name as string } : null,
      tags: tagsMap[row.id as string] ?? [],
      screenshots: screenshotsMap[row.id as string] ?? [],
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(Number(total) / limit) },
    stats: { 
      totalTrades, 
      winningTrades, 
      losingTrades, 
      winRate, 
      totalPnl: stats?.totalPnl ?? 0, 
      totalNetPnl: stats?.totalNetPnl ?? 0,
      avgPips: stats?.avgPips ?? 0,
      dailyProfit: stats?.dailyProfit ?? 0
    },
  });
});

// ─── POST /api/trades ────────────────────────────────────────────────────────
const createSchema = z.object({
  symbol:            z.string().min(1).transform(s => s.toUpperCase()),
  type:              z.enum(['BUY', 'SELL']),
  entryPrice:        z.number().positive(),
  exitPrice:         z.number().optional().nullable(),
  entryDate:         z.string(),
  exitDate:          z.string().optional().nullable(),
  quantity:          z.number().positive(),
  stopLoss:          z.number().optional().nullable(),
  takeProfit:        z.number().optional().nullable(),
  commission:        z.number().default(0),
  swap:              z.number().default(0),
  fees:              z.number().default(0),
  status:            z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).default('OPEN'),
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
  partialCloses: z.array(z.object({
    quantity:   z.number().positive(),
    exitPrice:  z.number().positive(),
    closedAt:   z.string().optional(),
    notes:      z.string().optional().nullable(),
  })).optional(),
});

trades.post('/', async (c) => {
  const userId = c.get('userId');
  try {
    let body: unknown;
    try { 
      body = await c.req.json(); 
    } catch { 
      return c.json({ error: 'Invalid JSON' }, 400); 
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
    const d = parsed.data;

    const entryDate = toUnix(d.entryDate);
    const exitDate  = d.exitDate ? toUnix(d.exitDate) : null;
    if (!entryDate) return c.json({ error: 'Invalid entry date' }, 400);

    // Calculate P&L
    let pnl: number | null = null, pnlPct: number | null = null;
    let netPnl: number | null = null, rMultiple: number | null = null;

    if (d.exitPrice && d.status === 'CLOSED') {
      let partialPnl = 0, partialQty = 0;
      for (const pc of d.partialCloses ?? []) {
        const { pnl: pcPnl } = calculatePnL(d.type, d.entryPrice, pc.exitPrice, pc.quantity, d.symbol);
        partialPnl += pcPnl; partialQty += pc.quantity;
      }
      const remainQty = Math.max(d.quantity - partialQty, 0);
      const result = calculatePnL(d.type, d.entryPrice, d.exitPrice, remainQty, d.symbol, d.commission, d.swap, d.fees, d.stopLoss);
      pnl = partialPnl + result.pnl;
      netPnl = partialPnl + result.netPnL;
      rMultiple = result.rMultiple;
      const posVal = d.entryPrice * d.quantity;
      pnlPct = posVal > 0 ? (pnl / posVal) * 100 : 0;

      // Safety checks for numeric fields
      const checkNum = (val: any) => (typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : 0);
      pnl = checkNum(pnl);
      netPnl = checkNum(netPnl);
      pnlPct = checkNum(pnlPct);
      rMultiple = checkNum(rMultiple);
    }

    const id = generateId();
    const now = Math.floor(Date.now() / 1000);

    await execute(c.env.DB, `
      INSERT INTO trades (
        id, userId, symbol, type, entryPrice, exitPrice, entryDate, exitDate,
        quantity, stopLoss, takeProfit, pnl, pnlPercentage, commission, swap, fees,
        netPnl, rMultiple, status, strategyId, setupType, marketCondition,
        entryEmotion, exitEmotion, preTradeAnalysis, postTradeAnalysis,
        lessonsLearned, rating, createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, userId, d.symbol, d.type, d.entryPrice, d.exitPrice ?? null,
        entryDate, exitDate, d.quantity, d.stopLoss ?? null, d.takeProfit ?? null,
        pnl, pnlPct, d.commission, d.swap, d.fees, netPnl, rMultiple,
        d.status, d.strategyId ?? null, d.setupType ?? null, d.marketCondition ?? null,
        d.entryEmotion ?? null, d.exitEmotion ?? null, d.preTradeAnalysis ?? null,
        d.postTradeAnalysis ?? null, d.lessonsLearned ?? null, d.rating ?? null,
        now, now,
      ],
    );

    // Tag associations
    for (const tagId of d.tagIds ?? []) {
      await execute(c.env.DB,
        'INSERT OR IGNORE INTO trade_tags (id, tradeId, tagId) VALUES (?, ?, ?)',
        [generateId(), id, tagId],
      );
    }

    // Partial closes
    for (const pc of d.partialCloses ?? []) {
      const { pnl: pcPnl } = calculatePnL(d.type, d.entryPrice, pc.exitPrice, pc.quantity, d.symbol);
      await execute(c.env.DB,
        'INSERT INTO partial_closes (id, tradeId, quantity, exitPrice, pnl, closedAt, notes) VALUES (?,?,?,?,?,?,?)',
        [generateId(), id, pc.quantity, pc.exitPrice, pcPnl, pc.closedAt ? toUnix(pc.closedAt) : now, pc.notes ?? null],
      );
    }

    const trade = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM trades WHERE id = ?', [id]);
    if (!trade) {
      throw new Error(`Failed to retrieve trade with ID ${id} after insertion.`);
    }
    return c.json(serializeTrade(trade), 201);
  } catch (err: any) {
    console.error('Trade creation error:', err);
    return c.json({ 
      error: 'Internal server error', 
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      details: String(err)
    }, 500);
  }
});

// ─── POST /api/trades/bulk ──────────────────────────────────────────────────
const bulkCreateSchema = z.object({
  trades: z.array(createSchema),
});

trades.post('/bulk', async (c) => {
  const userId = c.get('userId');
  try {
    const body = await c.req.json();
    const parsed = bulkCreateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);

    const results = [];
    const now = Math.floor(Date.now() / 1000);

    for (const d of parsed.data.trades) {
      const entryDate = toUnix(d.entryDate);
      const exitDate  = d.exitDate ? toUnix(d.exitDate) : null;
      
      let pnl = 0, pnlPct = 0, netPnl = 0, rMultiple: number | null = null;
      if (d.exitPrice && d.status === 'CLOSED') {
        const result = calculatePnL(d.type, d.entryPrice, d.exitPrice, d.quantity, d.symbol, d.commission, d.swap, d.fees, d.stopLoss);
        pnl = result.pnl;
        netPnl = result.netPnL;
        rMultiple = result.rMultiple;
        const posVal = d.entryPrice * d.quantity;
        pnlPct = posVal > 0 ? (pnl / posVal) * 100 : 0;
      }

      const id = generateId();
      await execute(c.env.DB, `
        INSERT INTO trades (
          id, userId, symbol, type, entryPrice, exitPrice, entryDate, exitDate,
          quantity, stopLoss, takeProfit, pnl, pnlPercentage, commission, swap, fees,
          netPnl, rMultiple, status, strategyId, createdAt, updatedAt
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, userId, d.symbol, d.type, d.entryPrice, d.exitPrice,
          entryDate, exitDate, d.quantity, d.stopLoss, d.takeProfit,
          pnl, pnlPct, d.commission, d.swap, d.fees, netPnl, rMultiple,
          d.status, d.strategyId, now, now
        ]
      );
      results.push(id);
    }

    return c.json({ success: true, count: results.length });
  } catch (err: any) {
    console.error('Bulk import error:', err);
    return c.json({ error: 'Internal server error', message: err.message }, 500);
  }
});

// ─── PUT /api/trades/:id ───────────────────────────────────────────────────
const updateSchema = createSchema.partial();

trades.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  try {
    const existing = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM trades WHERE id = ? AND userId = ?', [id, userId]);
    if (!existing) return c.json({ error: 'Trade not found' }, 404);

    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
    const d = parsed.data;

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    
    // Core fields
    const fields = [
      'symbol', 'type', 'entryPrice', 'exitPrice', 'entryDate', 'exitDate',
      'quantity', 'stopLoss', 'takeProfit', 'commission', 'swap', 'fees',
      'status', 'strategyId', 'setupType', 'marketCondition',
      'entryEmotion', 'exitEmotion', 'preTradeAnalysis', 'postTradeAnalysis',
      'lessonsLearned', 'rating'
    ];

    fields.forEach(f => {
      if (d[f as keyof typeof d] !== undefined) {
        updates.push(`${f} = ?`);
        let val = d[f as keyof typeof d];
        if (f === 'entryDate' || f === 'exitDate') {
          val = val ? toUnix(val as string) : null;
        }
        values.push(val);
      }
    });

    if (updates.length > 0) {
      // Recalculate P&L if relevant fields changed
      const current = { ...existing, ...d };
      // Ensure we have correct types for calculation
      const type = current.type as 'BUY' | 'SELL';
      const entryPrice = parseFloat(String(current.entryPrice));
      const exitPrice = current.exitPrice ? parseFloat(String(current.exitPrice)) : null;
      const quantity = parseFloat(String(current.quantity));
      
      if (exitPrice && (current.status === 'CLOSED' || d.status === 'CLOSED')) {
        const result = calculatePnL(
          type, entryPrice, exitPrice, quantity, current.symbol as string,
          parseFloat(String(current.commission || 0)),
          parseFloat(String(current.swap || 0)),
          parseFloat(String(current.fees || 0)),
          current.stopLoss ? parseFloat(String(current.stopLoss)) : null
        );
        updates.push('pnl = ?', 'netPnl = ?', 'pnlPercentage = ?', 'rMultiple = ?');
        values.push(result.pnl, result.netPnL, result.pnlPercentage, result.rMultiple);
      }

      updates.push('updatedAt = ?');
      values.push(Math.floor(Date.now() / 1000));

      await execute(c.env.DB, 
        `UPDATE trades SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
        [...values, id, userId]
      );
    }

    // Handle tags if provided
    if (d.tagIds) {
      await execute(c.env.DB, 'DELETE FROM trade_tags WHERE tradeId = ?', [id]);
      for (const tagId of d.tagIds) {
        await execute(c.env.DB,
          'INSERT OR IGNORE INTO trade_tags (id, tradeId, tagId) VALUES (?, ?, ?)',
          [generateId(), id, tagId]
        );
      }
    }

    const updated = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM trades WHERE id = ?', [id]);
    return c.json(serializeTrade(updated!));
  } catch (err: any) {
    console.error('Trade update error:', err);
    return c.json({ error: 'Internal server error', message: err.message }, 500);
  }
});

// ─── DELETE /api/trades/:id ────────────────────────────────────────────────
trades.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  try {
    const existing = await queryOne(c.env.DB, 'SELECT id FROM trades WHERE id = ? AND userId = ?', [id, userId]);
    if (!existing) return c.json({ error: 'Trade not found' }, 404);

    // Delete associated data
    await execute(c.env.DB, 'DELETE FROM trade_tags WHERE tradeId = ?', [id]);
    await execute(c.env.DB, 'DELETE FROM screenshots WHERE tradeId = ?', [id]);
    await execute(c.env.DB, 'DELETE FROM partial_closes WHERE tradeId = ?', [id]);
    
    // Delete trade
    await execute(c.env.DB, 'DELETE FROM trades WHERE id = ? AND userId = ?', [id, userId]);

    return c.json({ success: true, message: 'Trade deleted' });
  } catch (err: any) {
    console.error('Trade deletion error:', err);
    return c.json({ error: 'Internal server error', message: err.message }, 500);
  }
});

export default trades;
