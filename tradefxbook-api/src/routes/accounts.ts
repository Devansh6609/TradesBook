// src/routes/accounts.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { queryMany, queryOne, execute, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const accounts = new Hono<AppEnv>();

accounts.use('*', authMiddleware);

function serialize(row: any) {
  return {
    ...row,
    isDemo: row.isDemo === 1,
    isActive: row.isActive === 1,
    lastSyncAt: row.lastSyncAt ? fromUnix(row.lastSyncAt) : null,
  };
}

// GET /api/accounts - List all accounts
accounts.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await queryMany<any>(c.env.DB, 'SELECT * FROM accounts WHERE userId = ?', [userId]);
  return c.json({ accounts: rows.map(serialize) });
});

// GET /api/accounts/:id - Get account details
accounts.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const row = await queryOne<any>(c.env.DB, 'SELECT * FROM accounts WHERE id = ? AND userId = ?', [id, userId]);
  if (!row) return c.json({ error: 'Account not found' }, 404);
  return c.json(serialize(row));
});

// PUT /api/accounts/:id - Update account
const updateSchema = z.object({
  brokerName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountBalance: z.number().optional(),
  accountCurrency: z.string().optional(),
  isDemo: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

accounts.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  let body: any;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);

  const fields: string[] = [];
  const vals: any[] = [];
  
  if (parsed.data.brokerName !== undefined) { fields.push('brokerName = ?'); vals.push(parsed.data.brokerName); }
  if (parsed.data.accountNumber !== undefined) { fields.push('accountNumber = ?'); vals.push(parsed.data.accountNumber); }
  if (parsed.data.accountBalance !== undefined) { fields.push('accountBalance = ?'); vals.push(parsed.data.accountBalance); }
  if (parsed.data.accountCurrency !== undefined) { fields.push('accountCurrency = ?'); vals.push(parsed.data.accountCurrency); }
  if (parsed.data.isDemo !== undefined) { fields.push('isDemo = ?'); vals.push(parsed.data.isDemo ? 1 : 0); }
  if (parsed.data.isActive !== undefined) { fields.push('isActive = ?'); vals.push(parsed.data.isActive ? 1 : 0); }

  if (fields.length > 0) {
    await execute(c.env.DB, `UPDATE accounts SET ${fields.join(', ')} WHERE id = ? AND userId = ?`, [...vals, id, userId]);
  }

  const row = await queryOne<any>(c.env.DB, 'SELECT * FROM accounts WHERE id = ? AND userId = ?', [id, userId]);
  return c.json(serialize(row));
});

// DELETE /api/accounts/:id - Delete account
accounts.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await execute(c.env.DB, 'DELETE FROM accounts WHERE id = ? AND userId = ?', [id, userId]);
  return c.json({ message: 'Account deleted' });
});

export default accounts;
