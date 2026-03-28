import { z } from 'zod'

export const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  type: z.enum(['BUY', 'SELL'], {
    required_error: 'Direction is required',
  }),
  entryPrice: z.number().positive('Entry price must be positive'),
  exitPrice: z.number().optional(),
  entryDate: z.string().min(1, 'Entry date is required'),
  exitDate: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  commission: z.number().min(0).default(0),
  swap: z.number().default(0),
  fees: z.number().min(0).default(0),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).default('OPEN'),
  strategyId: z.string().optional(),
  newStrategy: z.string().optional(),
  setupType: z.string().optional(),
  marketCondition: z.enum(['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'VOLATILE', 'BREAKOUT', 'REVERSAL']).optional(),
  entryEmotion: z.enum(['CONFIDENT', 'FEARFUL', 'GREEDY', 'IMPATIENT', 'NEUTRAL', 'FRUSTRATED', 'EXCITED', 'CAUTIOUS']).optional(),
  exitEmotion: z.enum(['CONFIDENT', 'FEARFUL', 'GREEDY', 'IMPATIENT', 'NEUTRAL', 'FRUSTRATED', 'EXCITED', 'CAUTIOUS']).optional(),
  preTradeAnalysis: z.string().optional(),
  postTradeAnalysis: z.string().optional(),
  lessonsLearned: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
}).refine(
  (data) => {
    // If status is CLOSED, exit price is required
    if (data.status === 'CLOSED' && !data.exitPrice) {
      return false
    }
    return true
  },
  {
    message: 'Exit price is required for closed trades',
    path: ['exitPrice'],
  }
).refine(
  (data) => {
    // If exit price is provided, exit date should also be provided
    if (data.exitPrice && !data.exitDate) {
      return false
    }
    return true
  },
  {
    message: 'Exit date is required when exit price is provided',
    path: ['exitDate'],
  }
)

export const tradeFiltersSchema = z.object({
  symbol: z.string().optional(),
  type: z.enum(['BUY', 'SELL']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).optional(),
  strategyId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minPnl: z.number().optional(),
  maxPnl: z.number().optional(),
})

export const importRowSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(['BUY', 'SELL']),
  entryPrice: z.number().positive(),
  exitPrice: z.number().optional(),
  entryDate: z.string().or(z.date()),
  exitDate: z.string().or(z.date()).optional(),
  quantity: z.number().positive(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  commission: z.number().default(0),
  swap: z.number().default(0),
  fees: z.number().default(0),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'PENDING']).default('OPEN'),
  strategy: z.string().optional(),
})

export type TradeFormData = z.infer<typeof tradeSchema>
export type TradeFiltersData = z.infer<typeof tradeFiltersSchema>
export type ImportRowData = z.infer<typeof importRowSchema>

export const emotionOptions = [
  { value: 'CONFIDENT', label: 'Confident', emoji: '💪' },
  { value: 'FEARFUL', label: 'Fearful', emoji: '😰' },
  { value: 'GREEDY', label: 'Greedy', emoji: '🤤' },
  { value: 'IMPATIENT', label: 'Impatient', emoji: '⏰' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐' },
  { value: 'FRUSTRATED', label: 'Frustrated', emoji: '😤' },
  { value: 'EXCITED', label: 'Excited', emoji: '😄' },
  { value: 'CAUTIOUS', label: 'Cautious', emoji: '🤔' },
]

export const marketConditionOptions = [
  { value: 'TRENDING_UP', label: 'Trending Up', description: 'Strong upward momentum' },
  { value: 'TRENDING_DOWN', label: 'Trending Down', description: 'Strong downward momentum' },
  { value: 'RANGING', label: 'Ranging', description: 'Moving sideways in a range' },
  { value: 'VOLATILE', label: 'Volatile', description: 'High volatility, unpredictable' },
  { value: 'BREAKOUT', label: 'Breakout', description: 'Breaking out of consolidation' },
  { value: 'REVERSAL', label: 'Reversal', description: 'Potential trend reversal' },
]

export const statusOptions = [
  { value: 'OPEN', label: 'Open', color: 'blue' },
  { value: 'CLOSED', label: 'Closed', color: 'green' },
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
]

export const typeOptions = [
  { value: 'BUY', label: 'Buy', color: 'profit' },
  { value: 'SELL', label: 'Sell', color: 'loss' },
]
