// src/routes/tags.ts
// CRUD for trade tags

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryMany, queryOne, execute, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const tags = new Hono<AppEnv>();
tags.use('*', authMiddleware);

const schema = z.object({
  name:        z.string().min(1),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#3b82f6'),
  description: z.string().optional(),
});

function serialize(row: Record<string, unknown>) {
  return {
    id: row.id, userId: row.userId, name: row.name,
    color: row.color, description: row.description,
    createdAt: fromUnix(row.createdAt as number),
  };
}

tags.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await queryMany<Record<string, unknown>>(
    c.env.DB, 'SELECT * FROM tags WHERE userId = ? ORDER BY name ASC', [userId],
  );
  return c.json({ tags: rows.map(serialize) });
});

tags.post('/', async (c) => {
  const userId = c.get('userId');
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  const d = parsed.data;
  const existing = await queryOne(c.env.DB, 'SELECT id FROM tags WHERE userId = ? AND name = ?', [userId, d.name]);
  if (existing) return c.json({ error: 'Tag name already exists' }, 409);
  const id = generateId();
  const now = Math.floor(Date.now() / 1000);
  await execute(c.env.DB,
    'INSERT INTO tags (id, userId, name, color, description, createdAt) VALUES (?,?,?,?,?,?)',
    [id, userId, d.name, d.color, d.description ?? null, now],
  );
  const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM tags WHERE id = ?', [id]);
  return c.json(serialize(row!), 201);
});

tags.put('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const existing = await queryOne(c.env.DB, 'SELECT id FROM tags WHERE id = ? AND userId = ?', [id, userId]);
  if (!existing) return c.json({ error: 'Tag not found' }, 404);
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
  const parsed = schema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  const d = parsed.data;
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (d.name !== undefined)        { fields.push('name = ?');        vals.push(d.name); }
  if (d.color !== undefined)       { fields.push('color = ?');       vals.push(d.color); }
  if (d.description !== undefined) { fields.push('description = ?'); vals.push(d.description); }
  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400);
  await execute(c.env.DB, `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);
  const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM tags WHERE id = ?', [id]);
  return c.json(serialize(row!));
});

tags.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const row = await queryOne(c.env.DB, 'SELECT id FROM tags WHERE id = ? AND userId = ?', [id, userId]);
  if (!row) return c.json({ error: 'Tag not found' }, 404);
  await execute(c.env.DB, 'DELETE FROM tags WHERE id = ?', [id]);
  return c.json({ message: 'Tag deleted' });
});

export default tags;
