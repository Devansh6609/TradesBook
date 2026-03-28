import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, execute } from '../lib/db';

type Variables = {
  userId: string;
  userEmail: string;
};

type Bindings = {
  DB: import('@cloudflare/workers-types').D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper to safely parse dates to unix timestamp
const safeUnixTimestamp = (dateStr: string | undefined | null): number | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const ts = date.getTime();
  if (isNaN(ts)) {
    console.error(`Invalid date string received: "${dateStr}"`);
    return null;
  }
  return Math.floor(ts / 1000);
};

// ─── Sync Request (Frontend -> Worker) ──────────────────────────────────────
app.post('/sync', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { type, value } = z.object({
    type: z.enum(['COUNT', 'DATE', 'ALL']),
    value: z.string()
  }).parse(body);

  const id = generateId();
  await execute(c.env.DB, 
    `INSERT INTO sync_requests (id, userId, type, value, status, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, 'PENDING', unixepoch(), unixepoch())`,
    [id, userId, type, value]
  );

  return c.json({ success: true, id });
});


// ─── Webhook (MT5 -> Worker) ─────────────────────────────────────────────────
const AccountUpdateSchema = z.object({
  email: z.string().email(),
  type: z.literal('account_update'),
  balance: z.number(),
  equity: z.number(),
  freeMargin: z.number(),
});

const TradeUpdateSchema = z.object({
  email: z.string().email(),
  type: z.literal('trade_update'),
  ticket: z.string(),
  positionId: z.string(),
  symbol: z.string(),
  tradeType: z.enum(['BUY', 'SELL']),
  entryPrice: z.number(),
  exitPrice: z.number().optional(),
  entryDate: z.string(), // ISO String
  exitDate: z.string().optional(),
  quantity: z.number(),
  pnl: z.number(),
  commission: z.number().default(0),
  swap: z.number().default(0),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']),
});

const WebhookPayloadSchema = z.union([AccountUpdateSchema, TradeUpdateSchema]);

app.post('/', async (c) => {
  try {
    const rawText = await c.req.text();
    // MT5's WebRequest often adds a null byte at the end of char arrays.
    const cleanText = rawText.replace(/\0/g, '').trim();
    
    if (!cleanText) {
      return c.json({ error: 'Empty payload' }, 400);
    }

    let rawBody;
    try {
      rawBody = JSON.parse(cleanText);
      console.log('Webhook Body:', JSON.stringify(rawBody, null, 2));
    } catch (parseErr) {
      console.error('Failed to parse JSON. Raw text was:', JSON.stringify(cleanText));
      return c.json({ error: 'Invalid JSON format' }, 400);
    }

    let payload;
    try {
      payload = WebhookPayloadSchema.parse(rawBody);
    } catch (err: any) {
      console.error('Zod Validation Error:', JSON.stringify(err.errors, null, 2));
      return c.json({ error: 'Invalid payload', details: err.errors }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(payload.email)
      .first<{ id: string }>();

    if (!user) {
      return c.json({ error: 'User not found for provided email' }, 404);
    }

    const userId = user.id;

    // Find or create default broker account
    let account = await c.env.DB.prepare('SELECT id FROM accounts WHERE userId = ? LIMIT 1')
      .bind(userId)
      .first<{ id: string }>();

    let accountId = account?.id;
    if (!accountId) {
      accountId = generateId();
      await c.env.DB.prepare(
        'INSERT INTO accounts (id, userId, type, provider, providerAccountId, brokerName, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(accountId, userId, 'credentials', 'mt5', `mt5-${userId}`, 'MetaTrader 5', 1)
        .run();
    }

    // Handle account_update
    if (payload.type === 'account_update') {
      const unrealizedPnl = payload.equity - payload.balance;

      await c.env.DB.prepare('UPDATE accounts SET accountBalance = ?, unrealizedPnl = ?, lastSyncAt = unixepoch() WHERE id = ?')
        .bind(payload.balance, unrealizedPnl, accountId)
        .run();

      // Attempt to update settings balance as well
      await c.env.DB.prepare('UPDATE settings SET accountBalance = ?, unrealizedPnl = ?, updatedAt = unixepoch() WHERE userId = ?')
        .bind(payload.balance, unrealizedPnl, userId)
        .run();
    } 
    else if (payload.type === 'trade_update') {
      const entryTime = safeUnixTimestamp(payload.entryDate);
      const exitTime = safeUnixTimestamp(payload.exitDate);

      if (entryTime === null) {
        return c.json({ error: 'Invalid entryDate format', received: payload.entryDate }, 400);
      }
      const now = Math.floor(Date.now() / 1000);
      const netPnl = payload.pnl + payload.commission + payload.swap;

      // Check if trade exists by ticketId
      const existingTrade = await c.env.DB.prepare('SELECT id FROM trades WHERE ticketId = ?')
        .bind(payload.ticket)
        .first<{ id: string }>();

      if (existingTrade) {
        await c.env.DB.prepare(`
          UPDATE trades 
          SET exitPrice = ?, exitDate = ?, pnl = ?, commission = ?, swap = ?, netPnl = ?, status = ?, updatedAt = ?
          WHERE ticketId = ?
        `)
          .bind(
            payload.exitPrice !== undefined ? payload.exitPrice : null,
            exitTime,
            payload.pnl,
            payload.commission,
            payload.swap,
            netPnl,
            payload.status,
            now,
            payload.ticket
          )
          .run();
      } else {
        const tradeId = generateId();
        await c.env.DB.prepare(`
          INSERT INTO trades (
            id, userId, accountId, ticketId, symbol, type, quantity, 
            entryPrice, exitPrice, entryDate, exitDate, pnl, 
            commission, swap, netPnl, status, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            tradeId,
            userId,
            accountId,
            payload.ticket,
            payload.symbol,
            payload.tradeType,
            payload.quantity,
            payload.entryPrice,
            payload.exitPrice !== undefined ? payload.exitPrice : null,
            entryTime,
            exitTime,
            payload.pnl,
            payload.commission,
            payload.swap,
            netPnl,
            payload.status,
            now,
            now
          )
          .run();
      }
    }

    // Auto-expire any stale sync requests older than 2 minutes
    await c.env.DB.prepare(`
      UPDATE sync_requests SET status = 'COMPLETED', updatedAt = unixepoch()
      WHERE userId = ? AND status IN ('PENDING', 'PROCESSING') AND createdAt < (unixepoch() - 120)
    `).bind(userId).run();

    // Check for pending or processing sync requests
    const syncRequest = await c.env.DB.prepare(`
      SELECT id, type, value 
      FROM sync_requests 
      WHERE userId = ? AND status IN ('PENDING', 'PROCESSING') 
      ORDER BY createdAt DESC 
      LIMIT 1
    `)
      .bind(userId)
      .first<{ id: string, type: string, value: string }>();

    if (syncRequest) {
      // Mark as COMPLETED now that we've processed the payload
      await c.env.DB.prepare(`UPDATE sync_requests SET status = 'COMPLETED', updatedAt = unixepoch() WHERE id = ?`)
        .bind(syncRequest.id)
        .run();

      return c.json({
        success: true,
        message: 'Processed payload successfully',
        sync_request: {
          type: syncRequest.type,
          value: syncRequest.value
        }
      });
    }

    return c.json({ success: true, message: 'Processed payload successfully' }, 200);

  } catch (err: any) {
    console.error('Webhook Unexpected Error:', err);
    return c.json({ 
      error: 'Internal Server Error', 
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, 500);
  }
});

export default app;
