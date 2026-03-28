// src/routes/screenshots.ts
// POST /api/trades/:id/screenshots  — upload to R2, store key in D1
// DELETE /api/trades/:id/screenshots/:screenshotId

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryOne, execute, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const screenshots = new Hono<AppEnv>();
screenshots.use('*', authMiddleware);

// POST /api/trades/:id/screenshots
screenshots.post('/:id/screenshots', async (c) => {
  const userId = c.get('userId');
  const { id: tradeId } = c.req.param();

  // Verify trade ownership
  const trade = await queryOne(c.env.DB, 'SELECT id FROM trades WHERE id = ? AND userId = ?', [tradeId, userId]);
  if (!trade) return c.json({ error: 'Trade not found' }, 404);

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'Expected multipart/form-data' }, 400);
  }

  const file = formData.get('file') as File | null;
  const caption = formData.get('caption') as string | null;
  const chartType = formData.get('chartType') as string | null;

  if (!file) return c.json({ error: 'No file provided' }, 400);

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, 400);
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File too large. Max size: 10MB' }, 400);
  }

  const ext = file.type.split('/')[1] ?? 'jpg';
  const screenshotId = generateId();
  const r2Key = `screenshots/${tradeId}/${screenshotId}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.TRADE_SCREENSHOTS.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { tradeId, userId, chartType: chartType ?? '' },
  });

  const now = Math.floor(Date.now() / 1000);
  await execute(
    c.env.DB,
    'INSERT INTO screenshots (id, tradeId, url, caption, chartType, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [screenshotId, tradeId, r2Key, caption ?? null, chartType ?? null, now],
  );

  return c.json({
    id: screenshotId,
    tradeId,
    r2Key,
    caption,
    chartType,
    createdAt: fromUnix(now),
  }, 201);
});

// DELETE /api/trades/:id/screenshots/:screenshotId
screenshots.delete('/:id/screenshots/:screenshotId', async (c) => {
  const userId = c.get('userId');
  const { id: tradeId, screenshotId } = c.req.param();

  const ss = await queryOne<{ id: string; url: string }>(
    c.env.DB,
    `SELECT s.id, s.url FROM screenshots s
     JOIN trades t ON s.tradeId = t.id
     WHERE s.id = ? AND s.tradeId = ? AND t.userId = ?`,
    [screenshotId, tradeId, userId],
  );
  if (!ss) return c.json({ error: 'Screenshot not found' }, 404);

  // Delete from R2 first
  await c.env.TRADE_SCREENSHOTS.delete(ss.url);

  // Delete from D1
  await execute(c.env.DB, 'DELETE FROM screenshots WHERE id = ?', [screenshotId]);

  return c.json({ message: 'Screenshot deleted' });
});

export default screenshots;
