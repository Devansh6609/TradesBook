// src/lib/auth.ts
// Edge-compatible JWT auth using the `jose` library (no Node crypto needed)

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { generateId, toUnix } from './db';

const ACCESS_TOKEN_TTL  = 60 * 15;           // 15 minutes  (seconds)
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days     (seconds)

export interface AuthPayload extends JWTPayload {
  userId: string;
  email: string;
}

// ─── JWT helpers ────────────────────────────────────────────────────────────

function getSecret(jwtSecret: string): Uint8Array {
  return new TextEncoder().encode(jwtSecret);
}

/** Sign a short-lived access JWT */
export async function signAccessToken(
  payload: { userId: string; email: string },
  jwtSecret: string,
): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`15m`)
    .sign(getSecret(jwtSecret));
}

/** Verify an access JWT — throws if invalid/expired */
export async function verifyAccessToken(
  token: string,
  jwtSecret: string,
): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, getSecret(jwtSecret));
  return payload as AuthPayload;
}

// ─── Password hashing (pure-JS via Web Crypto PBKDF2) ───────────────────────

/** Hash a plaintext password with PBKDF2-SHA256 (edge-safe, no bcrypt) */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const hashArr = new Uint8Array(bits);
  // Store as hex: "salt_hex:hash_hex"
  const toHex = (arr: Uint8Array) =>
    Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${toHex(salt)}:${toHex(hashArr)}`;
}

/** Compare a plaintext password against a stored hash */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const fromHex = (hex: string) =>
    new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const salt = fromHex(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const derived = Array.from(new Uint8Array(bits), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  return derived === hashHex;
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
}

/** Create a session record in D1 and return the opaque refresh token */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function sessionExpiresAt(): number {
  return toUnix(new Date(Date.now() + REFRESH_TOKEN_TTL * 1000))!;
}
