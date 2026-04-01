// src/routes/images.ts
// GET /api/images/:key  — serve images from R2

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/authMiddleware';
import type { AppEnv } from '../index';

const images = new Hono<AppEnv>();

// We can keep this authenticated to prevent unauthorized access to journal screenshots
images.use('*', authMiddleware);

images.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  
  const object = await c.env.TRADE_SCREENSHOTS.get(key);
  
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  // Cache for 1 day
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(object.body, {
    headers,
  });
});

export default images;
