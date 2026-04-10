export type TradeStatus = "OPEN" | "CLOSED" | "CANCELLED" | "PENDING";

export interface Trade {
  id: string;
  userId: string;
  accountId?: string;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number | null;
  entryDate: string;
  exitDate: string | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
  pnlPercentage: number | null;
  commission: number;
  swap: number;
  fees: number;
  netPnl: number | null;
  riskAmount: number | null;
  riskPercentage: number | null;
  rMultiple: number | null;
  status: TradeStatus;
  strategyId: string | null;
  setupType: string | null;
  marketCondition: MarketCondition | null;
  entryEmotion: Emotion | null;
  exitEmotion: Emotion | null;
  preTradeAnalysis: string | null;
  postTradeAnalysis: string | null;
  lessonsLearned: string | null;
  notes: string | null;
  rating: number | null;
  executionChecklist?: string;
  createdAt: string;
  updatedAt: string;
  screenshots?: Screenshot[] | null;
  tags?: TradeTag[] | null;
  strategy?: Strategy | null;
  partialCloses?: PartialClose[];
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface TradeTag {
  id: string;
  tradeId?: string;
  tagId?: string;
  name?: string;
  color?: string;
  tag?: Tag;
  createdAt?: string;
}

export interface Screenshot {
  id: string;
  tradeId?: string;
  url: string | null;
  caption: string | null;
  chartType?: "ENTRY" | "EXIT" | "ANALYSIS" | "SETUP";
  createdAt?: string;
}

export interface PartialClose {
  id: string;
  tradeId: string;
  quantity: number;
  exitPrice: number;
  pnl?: number;
  closedAt: string;
  notes?: string | null;
}

export interface Strategy {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  rules?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  brokerName?: string;
  accountNumber?: string;
  accountBalance?: number;
  accountCurrency: string;
  isDemo: boolean;
  isActive: boolean;
  lastSyncAt?: string;
}

export interface FundedAccount {
  id: string;
  userId: string;
  accountId?: string;
  propFirmName: string;
  accountSize: number;
  startingBalance: number;
  dailyDrawdownLimit: number;
  maxDrawdownLimit: number;
  profitTarget: number;
  status: 'EVALUATION' | 'PASSED' | 'FAILED' | 'FUNDED';
  step: number;
  currentStep: number;
  drawdownType: 'STATIC' | 'TRAILING' | 'TRAILING_HIGH_WATERMARK';
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  userId: string;
  theme: "dark" | "light" | "system";
  currency: string;
  dateFormat: string;
  timezone: string;
  defaultTradeView: "list" | "grid" | "calendar";
  tradesPerPage: number;
  showClosedTrades: boolean;
  showOpenTrades: boolean;
  defaultDashboardView: "overview" | "analytics" | "calendar";
  favoriteSymbols: string[];
  emailNotifications: boolean;
  tradeAlerts: boolean;
  weeklyReports: boolean;
  publicProfile: boolean;
  shareAnalytics: boolean;
}

export type MarketCondition =
  | "TRENDING_UP"
  | "TRENDING_DOWN"
  | "RANGING"
  | "VOLATILE"
  | "BREAKOUT"
  | "REVERSAL";

export type Emotion =
  | "CONFIDENT"
  | "FEARFUL"
  | "GREEDY"
  | "IMPATIENT"
  | "NEUTRAL"
  | "FRUSTRATED"
  | "EXCITED"
  | "CAUTIOUS";

export interface DashboardStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  expectancy: number;
  rMultipleAvg: number;
}

export interface MonthlyStats {
  month: string;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
}

export interface TradeFilters {
  status?: string[];
  symbol?: string[];
  strategy?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  type?: string[];
  minPnl?: number;
  maxPnl?: number;
}

// Analytics Types
export interface EquityPoint {
  time: string;
  value: number;
  drawdown: number;
}

export interface DailyPnLPoint {
  date: string;
  pnl: string;
  trades: number;
  cumulativePnl: string;
}

export interface SymbolPerformance {
  symbol: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  profitFactor: number;
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  profitFactor: number;
  expectancy: number;
}

export interface AnalyticsSummary {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  averageTrade: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  expectancy: number;
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
  grossProfit: number;
  grossLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  bestTrade: number;
  worstTrade: number;
}
