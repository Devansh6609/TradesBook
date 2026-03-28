// src/middleware/authMiddleware.ts
// Hono middleware: validates Bearer JWT and injects userId into context

import { createMiddleware } from 'hono/factory';
import { verifyAccessToken } from '../lib/auth';
import type { AppEnv } from '../index';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authorization.slice(7);
  try {
    const payload = await verifyAccessToken(token, c.env.JWT_SECRET);
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
