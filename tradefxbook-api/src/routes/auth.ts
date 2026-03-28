// src/routes/auth.ts
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/me

import { Hono } from 'hono';
import { z } from 'zod';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  generateSessionToken,
  sessionExpiresAt,
} from '../lib/auth';
import { generateId, queryOne, execute } from '../lib/db';
import { authMiddleware } from '../middleware/authMiddleware';
import type { AppEnv } from '../index';

const auth = new Hono<AppEnv>();

// ─── Register ────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
});

auth.post('/register', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }
  const { email, password, name } = parsed.data;

  // Check duplicate email
  const existing = await queryOne(c.env.DB, 'SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const id = generateId();
  const hashedPassword = await hashPassword(password);
  const now = Math.floor(Date.now() / 1000);

  await execute(
    c.env.DB,
    `INSERT INTO users (id, email, name, password, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email, name ?? null, hashedPassword, now, now],
  );

  // Create default settings row
  await execute(
    c.env.DB,
    `INSERT INTO settings (id, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
    [generateId(), id, now, now],
  );

  // Issue tokens
  const accessToken = await signAccessToken({ userId: id, email }, c.env.JWT_SECRET);
  const sessionToken = generateSessionToken();
  const expiresAt = sessionExpiresAt();
  await execute(
    c.env.DB,
    `INSERT INTO sessions (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [generateId(), id, sessionToken, expiresAt, now],
  );

  return c.json(
    {
      user: { id, email, name: name ?? null },
      accessToken,
      refreshToken: sessionToken,
    },
    201,
  );
});

// ─── Login ───────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

auth.post('/login', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid credentials' }, 400);
  }
  const { email, password } = parsed.data;

  const user = await queryOne<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    password: string;
  }>(c.env.DB, 'SELECT id, email, name, image, password FROM users WHERE email = ?', [email]);

  if (!user || !user.password) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const accessToken = await signAccessToken({ userId: user.id, email: user.email }, c.env.JWT_SECRET);
  const sessionToken = generateSessionToken();
  const expiresAt = sessionExpiresAt();
  const now = Math.floor(Date.now() / 1000);
  await execute(
    c.env.DB,
    `INSERT INTO sessions (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [generateId(), user.id, sessionToken, expiresAt, now],
  );

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    accessToken,
    refreshToken: sessionToken,
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────
auth.post('/logout', authMiddleware, async (c) => {
  const authorization = c.req.header('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    // We delete all sessions for a clean logout; alternatively delete by token
    const userId = c.get('userId');
    await execute(c.env.DB, 'DELETE FROM sessions WHERE userId = ?', [userId]);
  }
  return c.json({ message: 'Logged out successfully' });
});

// ─── Me (get current user) ───────────────────────────────────────────────────
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await queryOne<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    reputation: number;
    createdAt: number;
  }>(
    c.env.DB,
    'SELECT id, email, name, image, reputation, createdAt FROM users WHERE id = ?',
    [userId],
  );
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user });
});

export default auth;
