// src/routes/strategies.ts
// CRUD for trading strategies

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryMany, queryOne, execute, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const strategies = new Hono<AppEnv>();
strategies.use('*', authMiddleware);

const schema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  rules:       z.string().optional(),
  isActive:    z.boolean().optional().default(true),
});

function serialize(row: Record<string, unknown>) {
  return {
    id: row.id, userId: row.userId, name: row.name,
    description: row.description, rules: row.rules,
    isActive: row.isActive === 1,
    createdAt: fromUnix(row.createdAt as number),
    updatedAt: fromUnix(row.updatedAt as number),
  };
}

strategies.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await queryMany<Record<string, unknown>>(
    c.env.DB,
    'SELECT * FROM strategies WHERE userId = ? ORDER BY createdAt DESC',
    [userId],
  );
  return c.json({ strategies: rows.map(serialize) });
});

strategies.get('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const row = await queryOne<Record<string, unknown>>(
    c.env.DB, 'SELECT * FROM strategies WHERE id = ? AND userId = ?', [id, userId],
  );
  if (!row) return c.json({ error: 'Strategy not found' }, 404);
  return c.json(serialize(row));
});

strategies.post('/', async (c) => {
  const userId = c.get('userId');
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  const d = parsed.data;
  const id = generateId();
  const now = Math.floor(Date.now() / 1000);
  await execute(c.env.DB,
    'INSERT INTO strategies (id, userId, name, description, rules, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)',
    [id, userId, d.name, d.description ?? null, d.rules ?? null, d.isActive ? 1 : 0, now, now],
  );
  const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM strategies WHERE id = ?', [id]);
  return c.json(serialize(row!), 201);
});

strategies.put('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const existing = await queryOne(c.env.DB, 'SELECT id FROM strategies WHERE id = ? AND userId = ?', [id, userId]);
  if (!existing) return c.json({ error: 'Strategy not found' }, 404);
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  const parsed = schema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  const d = parsed.data;
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = ['updatedAt = ?'];
  const vals: unknown[] = [now];
  if (d.name !== undefined)        { fields.push('name = ?');        vals.push(d.name); }
  if (d.description !== undefined) { fields.push('description = ?'); vals.push(d.description); }
  if (d.rules !== undefined)       { fields.push('rules = ?');       vals.push(d.rules); }
  if (d.isActive !== undefined)    { fields.push('isActive = ?');   vals.push(d.isActive ? 1 : 0); }
  await execute(c.env.DB, `UPDATE strategies SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);
  const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM strategies WHERE id = ?', [id]);
  return c.json(serialize(row!));
});

strategies.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const row = await queryOne(c.env.DB, 'SELECT id FROM strategies WHERE id = ? AND userId = ?', [id, userId]);
  if (!row) return c.json({ error: 'Strategy not found' }, 404);
  await execute(c.env.DB, 'DELETE FROM strategies WHERE id = ?', [id]);
  return c.json({ message: 'Strategy deleted' });
});

export default strategies;
