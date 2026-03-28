// lib/auth.ts
// Client-side auth helpers for the Cloudflare Worker JWT auth system

import { api, saveTokens, clearTokens, type UserProfile } from './apiClient';

// ─── Token management (persist across page refreshes via both localStorage + cookie) ──
export function setAuthTokens(accessToken: string, refreshToken: string) {
  saveTokens(accessToken, refreshToken);
  // Also set cookie so middleware.ts can check on the server side
  if (typeof window !== 'undefined') {
    document.cookie = `tradefxbook_access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
    document.cookie = `tradefxbook_refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}

export function clearAuthTokens() {
  clearTokens();
  if (typeof window !== 'undefined') {
    document.cookie = 'tradefxbook_access_token=; path=/; max-age=0';
    document.cookie = 'tradefxbook_refresh_token=; path=/; max-age=0';
  }
}

// ─── Auth actions ─────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<UserProfile> {
  const res = await api.auth.login({ email, password });
  setAuthTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function signUp(email: string, password: string, name?: string): Promise<UserProfile> {
  const res = await api.auth.register({ email, password, name });
  setAuthTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function signOut(): Promise<void> {
  try {
    await api.auth.logout();
  } catch {
    // best-effort server logout
  } finally {
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await api.auth.me();
    return res.user;
  } catch {
    return null;
  }
}

