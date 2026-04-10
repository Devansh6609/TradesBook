-- ============================================================
-- TradeFxBook — Cloudflare D1 Schema
-- SQLite-compatible DDL translated from Prisma schema
-- Run locally:  npx wrangler d1 execute tradefxbook-db --local --file=./schema.sql
-- Run remotely: npx wrangler d1 execute tradefxbook-db --remote --file=./schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- cuid generated in app
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password      TEXT,                      -- hashed with bcrypt
  image         TEXT,
  emailVerified INTEGER,                  -- Unix timestamp (NULL = unverified)
  reputation    INTEGER NOT NULL DEFAULT 0,
  createdAt     INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt     INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ─────────────────────────────────────────────────────────────
-- Sessions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expiresAt  INTEGER NOT NULL,
  createdAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);

-- ─────────────────────────────────────────────────────────────
-- Accounts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id                   TEXT PRIMARY KEY,
  userId               TEXT NOT NULL,
  type                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  providerAccountId    TEXT NOT NULL,
  refresh_token        TEXT,
  access_token         TEXT,
  expires_at           INTEGER,
  token_type           TEXT,
  scope                TEXT,
  id_token             TEXT,
  session_state        TEXT,
  brokerName           TEXT,
  accountNumber        TEXT,
  accountBalance       REAL,
  unrealizedPnl        REAL DEFAULT 0,
  accountCurrency      TEXT DEFAULT 'USD',
  isDemo               INTEGER DEFAULT 0,
  isActive             INTEGER DEFAULT 1,
  lastSyncAt           INTEGER,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (provider, providerAccountId)
);
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);

-- ─────────────────────────────────────────────────────────────
-- Strategies
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategies (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  rules       TEXT,
  isActive    INTEGER NOT NULL DEFAULT 1,
  createdAt   INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt   INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_userId ON strategies(userId);

-- ─────────────────────────────────────────────────────────────
-- Trades
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id                  TEXT PRIMARY KEY,
  userId              TEXT NOT NULL,
  accountId           TEXT,
  ticketId            TEXT UNIQUE,
  symbol              TEXT NOT NULL,
  type                TEXT NOT NULL,
  entryPrice          REAL NOT NULL,
  exitPrice           REAL,
  entryDate           INTEGER NOT NULL,
  exitDate            INTEGER,
  quantity            REAL NOT NULL,
  stopLoss            REAL,
  takeProfit          REAL,
  pnl                 REAL,
  pnlPercentage       REAL,
  commission          REAL DEFAULT 0,
  swap                REAL DEFAULT 0,
  fees                REAL DEFAULT 0,
  netPnl              REAL,
  riskAmount          REAL,
  riskPercentage      REAL,
  rMultiple           REAL,
  status              TEXT NOT NULL DEFAULT 'OPEN',
  strategyId          TEXT,
  setupType           TEXT,
  marketCondition     TEXT,
  entryEmotion        TEXT,
  exitEmotion         TEXT,
  preTradeAnalysis    TEXT,
  postTradeAnalysis   TEXT,
  lessonsLearned      TEXT,
  emotions            TEXT,
  rating              INTEGER,
  executionChecklist  TEXT,
  createdAt           INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt           INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (accountId)  REFERENCES accounts(id),
  FOREIGN KEY (strategyId) REFERENCES strategies(id)
);
CREATE INDEX IF NOT EXISTS idx_trades_userId     ON trades(userId);
CREATE INDEX IF NOT EXISTS idx_trades_symbol      ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entryDate  ON trades(entryDate);
CREATE INDEX IF NOT EXISTS idx_trades_status      ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_strategyId ON trades(strategyId);

-- ─────────────────────────────────────────────────────────────
-- Tags
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3b82f6',
  description TEXT,
  createdAt   INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (userId, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_userId ON tags(userId);

-- ─────────────────────────────────────────────────────────────
-- Trade Tags
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_tags (
  id         TEXT PRIMARY KEY,
  tradeId    TEXT NOT NULL,
  tagId      TEXT NOT NULL,
  createdAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (tradeId) REFERENCES trades(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId)   REFERENCES tags(id)   ON DELETE CASCADE,
  UNIQUE (tradeId, tagId)
);
CREATE INDEX IF NOT EXISTS idx_trade_tags_tradeId ON trade_tags(tradeId);
CREATE INDEX IF NOT EXISTS idx_trade_tags_tagId   ON trade_tags(tagId);

-- ─────────────────────────────────────────────────────────────
-- Partial Closes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partial_closes (
  id          TEXT PRIMARY KEY,
  tradeId     TEXT NOT NULL,
  quantity    REAL NOT NULL,
  exitPrice   REAL NOT NULL,
  pnl         REAL,
  closedAt    INTEGER NOT NULL DEFAULT (unixepoch()),
  notes       TEXT,
  FOREIGN KEY (tradeId) REFERENCES trades(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_partial_closes_tradeId ON partial_closes(tradeId);

-- ─────────────────────────────────────────────────────────────
-- Screenshots
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS screenshots (
  id         TEXT PRIMARY KEY,
  tradeId    TEXT NOT NULL,
  url        TEXT NOT NULL,
  caption    TEXT,
  chartType  TEXT,
  createdAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (tradeId) REFERENCES trades(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_screenshots_tradeId ON screenshots(tradeId);

-- ─────────────────────────────────────────────────────────────
-- Settings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                       TEXT PRIMARY KEY,
  userId                   TEXT NOT NULL UNIQUE,
  accountBalance           REAL,
  unrealizedPnl            REAL DEFAULT 0,
  theme                    TEXT NOT NULL DEFAULT 'dark',
  currency                 TEXT NOT NULL DEFAULT 'USD',
  dateFormat               TEXT NOT NULL DEFAULT 'MM/dd/yyyy',
  timezone                 TEXT NOT NULL DEFAULT 'UTC',
  defaultTradeView         TEXT NOT NULL DEFAULT 'list',
  tradesPerPage            INTEGER NOT NULL DEFAULT 25,
  showClosedTrades         INTEGER NOT NULL DEFAULT 1,
  showOpenTrades           INTEGER NOT NULL DEFAULT 1,
  defaultDashboardView     TEXT NOT NULL DEFAULT 'overview',
  favoriteSymbols          TEXT NOT NULL DEFAULT '',
  emailNotifications       INTEGER NOT NULL DEFAULT 1,
  tradeAlerts              INTEGER NOT NULL DEFAULT 1,
  weeklyReports            INTEGER NOT NULL DEFAULT 1,
  publicProfile            INTEGER NOT NULL DEFAULT 0,
  shareAnalytics           INTEGER NOT NULL DEFAULT 0,
  showOnLeaderboard        INTEGER NOT NULL DEFAULT 1,
  showTrades               INTEGER NOT NULL DEFAULT 0,
  showPnlPerTrade          INTEGER NOT NULL DEFAULT 1,
  showTotalPnl             INTEGER NOT NULL DEFAULT 1,
  showWinRate              INTEGER NOT NULL DEFAULT 1,
  showTradeCount           INTEGER NOT NULL DEFAULT 1,
  pushNotifications        INTEGER NOT NULL DEFAULT 0,
  createdAt                INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt                INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- Sync Requests
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_requests (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL,
  type       TEXT NOT NULL,
  value      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'PENDING',
  createdAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sync_requests_userId ON sync_requests(userId);
CREATE INDEX IF NOT EXISTS idx_sync_requests_status  ON sync_requests(status);

-- ─────────────────────────────────────────────────────────────
-- Posts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL,
  content    TEXT NOT NULL,
  tradeId    TEXT,
  createdAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (tradeId) REFERENCES trades(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_userId    ON posts(userId);
CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt);

-- ─────────────────────────────────────────────────────────────
-- Reactions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL,
  postId     TEXT NOT NULL,
  type       TEXT NOT NULL,
  createdAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (postId) REFERENCES posts(id)  ON DELETE CASCADE,
  UNIQUE (userId, postId)
);
CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions(postId);

-- ─────────────────────────────────────────────────────────────
-- Funded Accounts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funded_accounts (
  id                  TEXT PRIMARY KEY,
  userId              TEXT NOT NULL,
  accountId           TEXT,
  propFirmName        TEXT NOT NULL,
  accountSize         REAL NOT NULL,
  startingBalance     REAL NOT NULL,
  dailyDrawdownLimit  REAL NOT NULL,
  maxDrawdownLimit    REAL NOT NULL,
  profitTarget        REAL NOT NULL,
  status              TEXT NOT NULL DEFAULT 'EVALUATION',
  step                INTEGER NOT NULL DEFAULT 1,
  currentStep         INTEGER NOT NULL DEFAULT 1,
  drawdownType        TEXT NOT NULL DEFAULT 'STATIC',
  createdAt           INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt           INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (userId)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_funded_accounts_userId ON funded_accounts(userId);
