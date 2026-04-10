// src/index.ts
// Cloudflare Worker entry point — Hono app with all routes registered

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Routes
import auth      from './routes/auth';
import trades    from './routes/trades';
import tradeById from './routes/tradeById';
import screenshots from './routes/screenshots';
import strategies from './routes/strategies';
import tags      from './routes/tags';
import settings  from './routes/settings';
import accounts  from './routes/accounts';
import analytics from './routes/analytics';
import mt5       from './routes/mt5';
import images    from './routes/images';
import ai        from './routes/ai';

// ─── Bindings type (matches wrangler.toml) ───────────────────────────────────
export type Bindings = {
  DB: import('@cloudflare/workers-types').D1Database;
  TRADE_SCREENSHOTS: import('@cloudflare/workers-types').R2Bucket;
  JWT_SECRET: string;       // set via: npx wrangler secret put JWT_SECRET
  ENVIRONMENT: string;
  FRONTEND_URL: string;
  AI: import('@cloudflare/workers-types').Ai;
};

export type Variables = {
  userId: string;
  userEmail: string;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

// ─── App ────────────────────────────────────────────────────────────────────
const app = new Hono<AppEnv>();

// CORS — allow both local dev and production Pages URL
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') ?? '';
  const allowed = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://volitionary-francoise-patternlike.ngrok-free.dev',
    c.env.FRONTEND_URL,
  ].filter(Boolean);

  return cors({
    origin: (o) => (allowed.includes(o) ? o : allowed[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true,
    maxAge: 86400,
  })(c, next);
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ status: 'ok', service: 'TradeFxBook API', version: '2.0.0' }));
app.get('/health', (c) => c.json({ status: 'ok' }));

// ─── Route groups ────────────────────────────────────────────────────────────
app.route('/api/auth', auth);
app.route('/api/trades', trades);
app.route('/api/trades', tradeById);        // /:id routes
app.route('/api/trades', screenshots);      // /:id/screenshots routes
app.route('/api/strategies', strategies);
app.route('/api/tags', tags);
app.route('/api/settings', settings);
app.route('/api/accounts', accounts);
app.route('/api/analytics', analytics);
app.route('/api/mt5-webhook', mt5);
app.route('/api/images', images);
app.route('/api/ai-analysis', ai);

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route not found' }, 404));

// ─── Global error handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return c.json({ 
    error: 'Internal server error', 
    message,
    stack: err instanceof Error ? err.stack : undefined,
    details: String(err)
  }, 500);
});

export default app;
