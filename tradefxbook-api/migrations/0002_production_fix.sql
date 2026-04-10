PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "sync_requests";
DROP TABLE IF EXISTS "settings";
DROP TABLE IF EXISTS "trade_tags";
DROP TABLE IF EXISTS "tags";
DROP TABLE IF EXISTS "screenshots";
DROP TABLE IF EXISTS "partial_closes";
DROP TABLE IF EXISTS "trades";
DROP TABLE IF EXISTS "strategies";
DROP TABLE IF EXISTS "accounts";
DROP TABLE IF EXISTS "funded_accounts";
DROP TABLE IF EXISTS "users";

PRAGMA foreign_keys = ON;

-- 1. Users
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "emailVerified" DATETIME,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "reputation" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- 2. Accounts
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "brokerName" TEXT,
    "accountNumber" TEXT,
    "accountBalance" REAL,
    "unrealizedPnl" REAL DEFAULT 0,
    "accountCurrency" TEXT DEFAULT 'USD',
    "isDemo" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" INTEGER,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Strategies
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    CONSTRAINT "strategies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Trades
CREATE TABLE "trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "ticketId" TEXT,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "entryDate" INTEGER NOT NULL,
    "exitDate" INTEGER,
    "quantity" REAL NOT NULL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "pnl" REAL,
    "pnlPercentage" REAL,
    "commission" REAL DEFAULT 0,
    "swap" REAL DEFAULT 0,
    "fees" REAL DEFAULT 0,
    "netPnl" REAL,
    "riskAmount" REAL,
    "riskPercentage" REAL,
    "rMultiple" REAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "strategyId" TEXT,
    "setupType" TEXT,
    "marketCondition" TEXT,
    "entryEmotion" TEXT,
    "exitEmotion" TEXT,
    "preTradeAnalysis" TEXT,
    "postTradeAnalysis" TEXT,
    "lessonsLearned" TEXT,
    "emotions" TEXT,
    "rating" INTEGER,
    "executionChecklist" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    CONSTRAINT "trades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trades_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "trades_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "trades_ticketId_key" ON "trades"("ticketId");

-- 5. Sessions (CRITICAL)
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- 6. Settings
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountBalance" REAL,
    "unrealizedPnl" REAL DEFAULT 0,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/dd/yyyy',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "defaultTradeView" TEXT NOT NULL DEFAULT 'list',
    "tradesPerPage" INTEGER NOT NULL DEFAULT 25,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "settings_userId_key" ON "settings"("userId");

-- 7. Sync Requests
CREATE TABLE "sync_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    CONSTRAINT "sync_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. Tags & mappings
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "trade_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "trade_tags_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trade_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 9. Screenshots
CREATE TABLE "screenshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "chartType" TEXT,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "screenshots_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA foreign_keys = ON;
