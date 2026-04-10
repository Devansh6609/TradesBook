import { Trade, MarketCondition, Emotion, TradeTag, Screenshot, Strategy, PartialClose, Tag, DailyPnLPoint } from '@/types';

export interface TradingAccount {
  id: string;
  name: string;
  broker: string;
  accountNumber: string;
  platform: 'MT4' | 'MT5';
  balance: number;
  equity: number;
  currency: string;
  leverage: number;
  isPublic: boolean;
  isVerified: boolean;
  lastSyncAt: string | null;
  status: 'ACTIVE' | 'PENDING' | 'ERROR' | 'DISCONNECTED';
}

export interface ConnectAccountInput {
  name: string;
  broker: string;
  server: string;
  login: string;
  password?: string;
  investorPassword?: string;
  platform: 'MT4' | 'MT5';
}

export type { Trade, Strategy, Tag, DailyPnLPoint };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, API_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tradefxbook_access_token');
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('tradefxbook_access_token', accessToken);
  localStorage.setItem('tradefxbook_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('tradefxbook_access_token');
  localStorage.removeItem('tradefxbook_refresh_token');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...init } = options;
  const url = buildUrl(path, params);
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...init, headers });

    // Read response text first to handle both JSON and non-JSON (HTML errors)
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errorMessage = data?.error || data?.message || text || res.statusText || 'Request failed';
      throw new ApiError(res.status, errorMessage);
    }
    
    if (data === null && res.status !== 204) {
      throw new Error('Invalid or empty JSON response from server');
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error(`API Request failed [${path}]:`, err);
    throw err instanceof Error ? err : new Error('Network request failed');
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      request<{ user: UserProfile; accessToken: string; refreshToken: string }>('/api/auth/register', {
        method: 'POST', body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: UserProfile; accessToken: string; refreshToken: string }>('/api/auth/login', {
        method: 'POST', body: JSON.stringify(data),
      }),
    logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ user: UserProfile }>('/api/auth/me'),
  },

  // ─── Trades ──────────────────────────────────────────────────────────────
  trades: {
    list: (params?: TradeQueryParams) =>
      request<TradeListResponse>('/api/trades', { params: params as Record<string, string | number | boolean> }),
    get: (id: string) => request<Trade>(`/api/trades/${id}`),
    create: (data: CreateTradeInput) =>
      request<Trade>('/api/trades', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateTradeInput>) =>
      request<Trade>(`/api/trades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/api/trades/${id}`, { method: 'DELETE' }),
    bulkImport: (data: any) => request<{ success: boolean; count: number }>('/api/trades/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ─── Screenshots ─────────────────────────────────────────────────────────
  screenshots: {
    upload: (tradeId: string, file: File, caption?: string, chartType?: string) => {
      const form = new FormData();
      form.append('file', file);
      if (caption)   form.append('caption', caption);
      if (chartType) form.append('chartType', chartType);
      const token = getToken();
      return fetch(buildUrl(`/api/trades/${tradeId}/screenshots`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      }).then((r) => r.json());
    },
    delete: (tradeId: string, screenshotId: string) =>
      request<{ message: string }>(`/api/trades/${tradeId}/screenshots/${screenshotId}`, { method: 'DELETE' }),
    getUrl: (key: string) => `${API_URL}/api/images/${key}`,
  },

  // ─── Strategies ──────────────────────────────────────────────────────────
  strategies: {
    list: () => request<{ strategies: Strategy[] }>('/api/strategies'),
    get: (id: string) => request<Strategy>(`/api/strategies/${id}`),
    create: (data: { name: string; description?: string; rules?: string; isActive?: boolean }) =>
      request<Strategy>('/api/strategies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; description: string; rules: string; isActive: boolean }>) =>
      request<Strategy>(`/api/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/api/strategies/${id}`, { method: 'DELETE' }),
  },

  // ─── Tags ────────────────────────────────────────────────────────────────
  tags: {
    list: () => request<{ tags: Tag[] }>('/api/tags'),
    create: (data: { name: string; color?: string; description?: string }) =>
      request<Tag>('/api/tags', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; color: string; description: string }>) =>
      request<Tag>(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/api/tags/${id}`, { method: 'DELETE' }),
  },

  // ─── Settings ────────────────────────────────────────────────────────────
  settings: {
    get: () => request<Settings>('/api/settings'),
    update: (data: Partial<Settings>) =>
      request<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    clearData: () => request<{ message: string }>('/api/settings/data', { method: 'DELETE' }),
  },

  // ─── Analytics ───────────────────────────────────────────────────────────
  analytics: {
    overview: () => request<AnalyticsOverview>('/api/analytics/overview'),
    strategyPerformance: () => request<StrategyPerformanceResponse>('/api/analytics/strategy-performance'),
    dailyPnL: (params: { dateFrom?: string; dateTo?: string }) => 
      request<{ dailyPnL: DailyPnLPoint[] }>('/api/analytics/daily-pnl', { params }),
    dashboard: (params: { period?: string; filter?: string }) =>
      request<AnalyticsData>('/api/analytics', { params }),
    live: () =>
      request<{
        initialBalance: number;
        unrealizedPnl: number;
        equity: number;
        openTrades: number;
        totalTrades: number;
        totalPnl: number;
        totalNetPnl: number;
        winRate: number;
        averageWin: number;
        averageLoss: number;
        bestTrade: number;
        worstTrade: number;
        isSyncing: boolean;
      }>('/api/analytics/live'),
  },

  // ─── Accounts ────────────────────────────────────────────────────────────
  accounts: {
    list: () => request<{ accounts: TradingAccount[] }>('/api/accounts'),
    get: (id: string) => request<TradingAccount>(`/api/accounts/${id}`),
    update: (id: string, data: Partial<TradingAccount>) =>
      request<TradingAccount>(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/api/accounts/${id}`, { method: 'DELETE' }),
  },

  // ─── MT5/MT4 Connection ──────────────────────────────────────────────────
  mt5: {
    connect: (data: ConnectAccountInput) =>
      request<{ account: TradingAccount }>('/api/mt5/connect', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Sync ────────────────────────────────────────────────────────────────
  sync: {
    request: (data: { type: 'COUNT' | 'DATE' | 'ALL'; value: string }) =>
      request<{ success: boolean; id: string }>('/api/mt5-webhook/sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── News ────────────────────────────────────────────────────────────────
  news: {
    list: () => request<{ news: NewsItem[] }>('/api/news'),
  },

  // ─── Community ───────────────────────────────────────────────────────────
  community: {
    posts: () => request<{ posts: Post[] }>('/api/community/posts'),
    createPost: (content: string) =>
      request<Post>('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    leaderboard: () => request<{ leaderboard: LeaderboardEntry[] }>('/api/community/leaderboard'),
  },
};

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string; email: string; name: string | null; image: string | null; reputation?: number;
}
export interface TradeListResponse {
  trades: Trade[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: { totalTrades: number; winningTrades: number; losingTrades: number; winRate: number; totalPnl: number; totalNetPnl: number; avgPips: number; dailyProfit: number };
}
export type CreateTradeInput = Pick<Trade, 'symbol' | 'type' | 'entryPrice' | 'quantity'> & Partial<Trade> & {
  tagIds?: string[];
  partialCloses?: { quantity: number; exitPrice: number; closedAt?: string; notes?: string | null }[];
};
// Trade interface imported from @/types
export type TradeQueryParams = Partial<{
  page: number; limit: number; symbol: string; status: string;
  type: string; strategyId: string; dateFrom: string; dateTo: string;
  minPnl: number; maxPnl: number; pnlFilter: 'positive' | 'negative';
  sortBy: string; sortOrder: 'asc' | 'desc';
}>;
export interface Settings { theme: string; currency: string; dateFormat: string; timezone: string; tradesPerPage: number; accountBalance: number | null; [key: string]: unknown; }
export interface AnalyticsOverview { overview: Record<string, number>; monthly: { month: string; pnl: number; trades: number }[]; }
export interface StrategyPerformanceResponse { strategies: { strategyId: string | null; strategyName: string; totalTrades: number; winRate: number; totalPnl: number; avgPnl: number }[]; }

export interface AnalyticsData {
  initialBalance: number;
  unrealizedPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: string;
  grossLoss: string;
  totalPnl: string;
  totalNetPnl: string;
  avgWinner: string;
  avgLoser: string;
  profitFactor: number;
  expectancy: number;
  bestTrade: string | number;
  worstTrade: string | number;
  winStreak: number;
  lossStreak: number;
  riskRewardRatio: string | number;
  openTrades: number;
  equityCurve: { date: string; equity: number; pnl: number; time: string; value: number; drawdown: number }[];
  dailyPnL: DailyPnLPoint[];
  trades: Trade[];
  monthlyStats: { month: string; profit: number; trades: number }[];
  dayOfWeekPerformance: { day: string; pnl: number; trades: number; winRate: number }[];
  longShortPerformance: {
    long: { wins: number; losses: number; pnl: number; trades: number; winRate: number; bestTrade: number };
    short: { wins: number; losses: number; pnl: number; trades: number; winRate: number; bestTrade: number };
  };
  sessionPerformance?: { session: string; pnl: number; trades: number; winRate: number }[];
}

export interface NewsItem { title: string; link: string; date: string; description: string; source: string; }
export interface Post { id: string; userId: string; user?: UserProfile; content: string; createdAt: string; likes: number; comments: number; }
export interface LeaderboardEntry { userId: string; name: string; winRate: number; profit: number; totalTrades: number; }

