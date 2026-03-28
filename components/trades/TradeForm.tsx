'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Trade } from '@/types'
import { calculateTradePnL, calculatePips } from '@/lib/trades'
import { z } from 'zod'
import { Plus, X, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AssetIcon } from "@/components/market/AssetIcon"

interface TradeFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  trade?: Trade | null
  strategies: { id: string; name: string }[]
  tags: { id: string; name: string; color: string }[]
  loading?: boolean
}

export interface TradeFormData {
  symbol: string
  type: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice?: number
  entryDate: string
  exitDate?: string
  quantity: number
  stopLoss?: number
  takeProfit?: number
  commission: number
  swap: number
  fees: number
  status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING'
  strategyId?: string
  newStrategy?: string
  setupType?: string
  marketCondition?: string
  entryEmotion?: string
  exitEmotion?: string
  preTradeAnalysis?: string
  postTradeAnalysis?: string
  lessonsLearned?: string
  tagIds: string[]
  notes?: string
}

// Popular forex & trading symbols for autocomplete
const SYMBOL_SUGGESTIONS = [
  { symbol: 'XAUUSD', description: 'Gold vs US Dollar' },
  { symbol: 'XAUUSD', description: 'Gold vs US Dollar, Spot CFD' },
  { symbol: 'XAUUSD', description: 'Gold vs US Dollar / Spot' },
  { symbol: 'XAUUSD', description: 'Gold US Dollar' },
  { symbol: 'XAUAUD', description: 'Gold vs Australian Dollar / Spot' },
  { symbol: 'EURUSD', description: 'Euro vs US Dollar' },
  { symbol: 'GBPUSD', description: 'British Pound vs US Dollar' },
  { symbol: 'USDJPY', description: 'US Dollar vs Japanese Yen' },
  { symbol: 'USDCHF', description: 'US Dollar vs Swiss Franc' },
  { symbol: 'AUDUSD', description: 'Australian Dollar vs US Dollar' },
  { symbol: 'NZDUSD', description: 'New Zealand Dollar vs US Dollar' },
  { symbol: 'USDCAD', description: 'US Dollar vs Canadian Dollar' },
  { symbol: 'EURJPY', description: 'Euro vs Japanese Yen' },
  { symbol: 'GBPJPY', description: 'British Pound vs Japanese Yen' },
  { symbol: 'EURGBP', description: 'Euro vs British Pound' },
  { symbol: 'BTCUSD', description: 'Bitcoin vs US Dollar' },
  { symbol: 'ETHUSD', description: 'Ethereum vs US Dollar' },
  { symbol: 'US30', description: 'Dow Jones Industrial Average' },
  { symbol: 'NAS100', description: 'NASDAQ 100 Index' },
  { symbol: 'SPX500', description: 'S&P 500 Index' },
]

export function TradeForm({
  isOpen,
  onClose,
  onSubmit,
  trade,
  strategies,
  tags,
  loading,
}: TradeFormProps) {
  const isEditing = !!trade
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)
  const [calculatedPnL, setCalculatedPnL] = useState<{ pnl: number; netPnL: number; pips: number } | null>(null)

  // Partial close state
  const [partialCloseQty, setPartialCloseQty] = useState<number>(0)
  const [partialClosePrice, setPartialClosePrice] = useState<number>(0)
  const [pendingPartialCloses, setPendingPartialCloses] = useState<{ quantity: number; exitPrice: number; pnl: number }[]>([])

  const [formData, setFormData] = useState<TradeFormData>({
    symbol: '',
    type: 'BUY',
    entryPrice: 0,
    exitPrice: undefined,
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: undefined,
    quantity: 0,
    stopLoss: undefined,
    takeProfit: undefined,
    commission: 0,
    swap: 0,
    fees: 0,
    status: 'OPEN',
    strategyId: '',
    newStrategy: '',
    setupType: '',
    marketCondition: undefined,
    entryEmotion: undefined,
    exitEmotion: undefined,
    preTradeAnalysis: '',
    postTradeAnalysis: '',
    lessonsLearned: '',
    tagIds: [],
    notes: '',
  })

  // Filtered symbol suggestions based on input
  const filteredSymbols = useMemo(() => {
    if (!formData.symbol) return []
    const search = formData.symbol.toUpperCase()
    return SYMBOL_SUGGESTIONS.filter(s =>
      s.symbol.includes(search) || s.description.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8)
  }, [formData.symbol])

  // Populate form when editing
  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol,
        type: trade.type,
        entryPrice: parseFloat(trade.entryPrice?.toString() || '0'),
        exitPrice: trade.exitPrice ? parseFloat(trade.exitPrice.toString()) : undefined,
        entryDate: trade.entryDate
          ? new Date(trade.entryDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        exitDate: trade.exitDate
          ? new Date(trade.exitDate).toISOString().slice(0, 16)
          : undefined,
        quantity: parseFloat(trade.quantity?.toString() || '0'),
        stopLoss: trade.stopLoss ? parseFloat(trade.stopLoss.toString()) : undefined,
        takeProfit: trade.takeProfit ? parseFloat(trade.takeProfit.toString()) : undefined,
        commission: parseFloat(trade.commission?.toString() || '0'),
        swap: parseFloat(trade.swap?.toString() || '0'),
        fees: parseFloat(trade.fees?.toString() || '0'),
        status: trade.status,
        strategyId: trade.strategyId || '',
        newStrategy: '',
        setupType: trade.setupType || '',
        marketCondition: trade.marketCondition || undefined,
        entryEmotion: trade.entryEmotion || undefined,
        exitEmotion: trade.exitEmotion || undefined,
        preTradeAnalysis: trade.preTradeAnalysis || '',
        postTradeAnalysis: trade.postTradeAnalysis || '',
        lessonsLearned: trade.lessonsLearned || '',
        tagIds: trade.tags?.map((t) => t.tagId || t.tag?.id || '').filter(Boolean) || [],
        notes: trade.notes || '',
      })
    } else {
      // Reset form for new trade
      setFormData({
        symbol: '',
        type: 'BUY',
        entryPrice: 0,
        exitPrice: undefined,
        entryDate: new Date().toISOString().slice(0, 16),
        exitDate: undefined,
        quantity: 0,
        stopLoss: undefined,
        takeProfit: undefined,
        commission: 0,
        swap: 0,
        fees: 0,
        status: 'OPEN',
        strategyId: '',
        newStrategy: '',
        setupType: '',
        marketCondition: undefined,
        entryEmotion: undefined,
        exitEmotion: undefined,
        preTradeAnalysis: '',
        postTradeAnalysis: '',
        lessonsLearned: '',
        tagIds: [],
        notes: '',
      })
    }
    setErrors({})
    setCalculatedPnL(null)
    setPartialCloseQty(0)
    setPartialClosePrice(0)
    setPendingPartialCloses([])
  }, [trade, isOpen])

  // Calculate P&L and pips when relevant fields change
  useEffect(() => {
    if (formData.exitPrice && formData.entryPrice && formData.quantity && formData.symbol) {
      // Sum up all partial close quantities and P&Ls
      const existingPartialCloses = (trade as any)?.partialCloses || []
      const allPartialCloses = [...existingPartialCloses, ...pendingPartialCloses]
      const partialCloseQtySum = allPartialCloses.reduce((sum: number, pc: any) => sum + Number(pc.quantity), 0)
      const partialClosePnLSum = allPartialCloses.reduce((sum: number, pc: any) => sum + Number(pc.pnl || 0), 0)

      // Remaining quantity after partial closes
      const remainingQty = Math.max(formData.quantity - partialCloseQtySum, 0)

      // P&L on the remaining position at exit price
      const remainingResult = calculateTradePnL({
        type: formData.type,
        entryPrice: formData.entryPrice,
        exitPrice: formData.exitPrice,
        quantity: remainingQty,
        symbol: formData.symbol,
        commission: formData.commission,
        swap: formData.swap,
        fees: formData.fees,
        stopLoss: formData.stopLoss,
      })

      // Total P&L = partial close P&Ls + remaining position P&L
      const totalPnl = partialClosePnLSum + remainingResult.pnl
      const totalNetPnl = partialClosePnLSum + remainingResult.netPnL

      // Calculate pips (based on entry→exit, independent of qty)
      const pips = calculatePips(formData.symbol, formData.entryPrice, formData.exitPrice, formData.type)

      setCalculatedPnL({ pnl: totalPnl, netPnL: totalNetPnl, pips })
    } else {
      setCalculatedPnL(null)
    }
  }, [formData, pendingPartialCloses, trade])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    }
    if (!formData.entryPrice || formData.entryPrice <= 0) {
      newErrors.entryPrice = 'Entry price is required'
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Auto-set status based on exit price
      const finalData = { ...formData }
      if (finalData.exitPrice && finalData.exitPrice > 0) {
        finalData.status = 'CLOSED'
      }

      // Convert datetime-local format to proper ISO string
      // datetime-local gives "2026-02-08T10:41", new Date() parses it correctly
      const entryDateISO = new Date(finalData.entryDate).toISOString()
      const exitDateISO = finalData.exitDate
        ? new Date(finalData.exitDate).toISOString()
        : undefined

      const apiData: Record<string, any> = {
        symbol: finalData.symbol,
        type: finalData.type,
        status: finalData.status,
        entryDate: entryDateISO,
        exitDate: exitDateISO,
        // Parse numbers properly
        entryPrice: Number(finalData.entryPrice),
        exitPrice: finalData.exitPrice ? Number(finalData.exitPrice) : undefined,
        quantity: Number(finalData.quantity),
        stopLoss: finalData.stopLoss ? Number(finalData.stopLoss) : undefined,
        takeProfit: finalData.takeProfit ? Number(finalData.takeProfit) : undefined,
        commission: Number(finalData.commission) || 0,
        swap: Number(finalData.swap) || 0,
        fees: Number(finalData.fees) || 0,
        // Remove empty string fields that should be undefined
        strategyId: finalData.strategyId || undefined,
        setupType: finalData.setupType || undefined,
        marketCondition: finalData.marketCondition || undefined,
        entryEmotion: finalData.entryEmotion || undefined,
        exitEmotion: finalData.exitEmotion || undefined,
        preTradeAnalysis: finalData.preTradeAnalysis || undefined,
        postTradeAnalysis: finalData.postTradeAnalysis || undefined,
        lessonsLearned: finalData.lessonsLearned || undefined,
        notes: finalData.notes || undefined,
        tagIds: finalData.tagIds,
      }

      // Strip undefined values to avoid sending them
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === undefined) {
          delete apiData[key]
        }
      })

      // Include pending partial closes if any
      if (pendingPartialCloses.length > 0) {
        apiData.partialCloses = pendingPartialCloses.map(pc => ({
          quantity: pc.quantity,
          exitPrice: pc.exitPrice,
        }));
      }

      console.log('Submitting trade data:', apiData)
      onSubmit(apiData)
    }
  }

  const updateField = <K extends keyof TradeFormData>(field: K, value: TradeFormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-update status based on exit price
      if (field === 'exitPrice') {
        if (value && (value as number) > 0) {
          newData.status = 'CLOSED'
          if (!prev.exitDate) {
            newData.exitDate = new Date().toISOString().slice(0, 16)
          }
        } else if (prev.status === 'CLOSED') {
          newData.status = 'OPEN'
        }
      }

      return newData
    })

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const selectSymbol = (symbol: string) => {
    updateField('symbol', symbol)
    setShowSymbolDropdown(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      className="bg-[var(--card-bg)] border-[var(--border)] text-[var(--foreground)] transition-colors duration-300"
    >
      <form onSubmit={handleSubmit} className="p-1 space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between -mt-1 mb-2 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600/10 flex items-center justify-center">
              <Plus size={14} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              {isEditing ? 'Edit Trade' : 'New Trade'}
            </h2>
          </div>

          {/* Compact Long/Short Toggle */}
          <div className="flex p-0.5 bg-[var(--background-tertiary)] rounded-lg text-xs font-medium border border-[var(--border)]">
            <button
              type="button"
              onClick={() => updateField('type', 'BUY')}
              className={cn(
                'px-3 py-1 rounded-md transition-all duration-200 flex items-center gap-1.5',
                formData.type === 'BUY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              )}
            >
              <TrendingUp size={12} />
              BUY
            </button>
            <button
              type="button"
              onClick={() => updateField('type', 'SELL')}
              className={cn(
                'px-3 py-1 rounded-md transition-all duration-200 flex items-center gap-1.5',
                formData.type === 'SELL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              )}
            >
              <TrendingDown size={12} />
              SELL
            </button>
          </div>
        </div>

        {/* Row 1: Symbol & Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <label htmlFor="symbol" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Symbol</label>
            <input
              id="symbol"
              type="text"
              placeholder="XAUUSD"
              value={formData.symbol}
              onChange={(e) => {
                updateField('symbol', e.target.value.toUpperCase())
                setShowSymbolDropdown(true)
              }}
              onFocus={() => setShowSymbolDropdown(true)}
              onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
              className={cn(
                'w-full h-9 px-3 bg-[var(--input-bg)] border rounded-lg text-sm font-semibold text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] transition-all',
                'focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500',
                errors.symbol ? 'border-red-500' : 'border-[var(--border)] group-hover:border-[var(--border-hover)]'
              )}
            />

            {showSymbolDropdown && filteredSymbols.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredSymbols.map((item, idx) => (
                  <button
                    key={`${item.symbol}-${idx}`}
                    type="button"
                    onClick={() => selectSymbol(item.symbol)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--background-tertiary)] transition-colors text-left border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <AssetIcon symbol={item.symbol} size="sm" />
                      <span className="font-semibold text-xs text-[var(--foreground)]">{item.symbol}</span>
                    </div>
                    <span className="text-[10px] text-[var(--foreground-muted)]">{item.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="group">
            <label htmlFor="quantity" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Lots</label>
            <input
              id="quantity"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.quantity || ''}
              onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
              className={cn(
                'w-full h-9 px-3 bg-[var(--input-bg)] border rounded-lg text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] transition-all',
                'focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500',
                errors.quantity ? 'border-red-500' : 'border-[var(--border)] group-hover:border-[var(--border-hover)]'
              )}
            />
          </div>
        </div>

        {/* Row 2: Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="group">
            <label htmlFor="entryPrice" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Entry Price</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-[var(--foreground-disabled)] text-xs">$</span>
              <input
                id="entryPrice"
                type="number"
                placeholder="0.00000"
                step="0.00001"
                value={formData.entryPrice || ''}
                onChange={(e) => updateField('entryPrice', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full h-9 pl-6 pr-3 bg-[var(--input-bg)] border rounded-lg text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] transition-all',
                  'focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500',
                  errors.entryPrice ? 'border-red-500' : 'border-[var(--border)] group-hover:border-[var(--border-hover)]'
                )}
              />
            </div>
          </div>

          <div className="group">
            <label htmlFor="exitPrice" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Exit Price</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-[var(--foreground-disabled)] text-xs">$</span>
              <input
                id="exitPrice"
                type="number"
                placeholder="Optional"
                step="0.00001"
                value={formData.exitPrice || ''}
                onChange={(e) => updateField('exitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full h-9 pl-6 pr-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] transition-all focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 group-hover:border-[var(--border-hover)]"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="group">
            <label htmlFor="entryDate" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Open Time</label>
            <input
              id="entryDate"
              type="datetime-local"
              value={formData.entryDate}
              onChange={(e) => updateField('entryDate', e.target.value)}
              className="w-full h-9 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all group-hover:border-[var(--border-hover)] [color-scheme:dark]"
            />
          </div>

          <div className="group">
            <label htmlFor="exitDate" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Close Time</label>
            <input
              id="exitDate"
              type="datetime-local"
              value={formData.exitDate || ''}
              onChange={(e) => updateField('exitDate', e.target.value || undefined)}
              className="w-full h-9 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all group-hover:border-[var(--border-hover)] [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Row 4: Notes (Combines Analysis) */}
        <div className="group">
          <label htmlFor="notes" className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-1 block">Notes / Analysis</label>
          <textarea
            id="notes"
            placeholder="Quick notes..."
            value={formData.notes || formData.preTradeAnalysis || ''}
            onChange={(e) => {
              updateField('notes', e.target.value)
              updateField('preTradeAnalysis', e.target.value)
            }}
            rows={2}
            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all group-hover:border-[var(--border-hover)]"
          />
        </div>

        {/* Partial Close Section */}
        {(
          <div className="border border-[var(--border)] rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Partial Closes</span>
              {trade?.partialCloses && trade.partialCloses.length > 0 && (
                <span className="text-[10px] text-[var(--foreground-muted)]">
                  {trade.partialCloses.length} existing
                </span>
              )}
            </div>

            {/* Existing partial closes */}
            {trade?.partialCloses && trade.partialCloses.length > 0 && (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {trade.partialCloses.map((pc, idx) => (
                  <div key={pc.id || idx} className="flex items-center justify-between text-xs p-2 bg-[var(--background-tertiary)] rounded-md">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[var(--foreground)]">{parseFloat(String(pc.quantity)).toFixed(2)} lots</span>
                      <span className="text-[var(--foreground-muted)]">@</span>
                      <span className="font-mono text-[var(--foreground)]">{parseFloat(String(pc.exitPrice)).toFixed(5)}</span>
                    </div>
                    <span className={cn(
                      "font-mono font-semibold",
                      pc.pnl && parseFloat(String(pc.pnl)) >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
                    )}>
                      {pc.pnl ? `${parseFloat(String(pc.pnl)) >= 0 ? '+' : ''}$${parseFloat(String(pc.pnl)).toFixed(2)}` : '-'}
                    </span>
                  </div>
                ))}
                {/* Total P&L from partial closes */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--border)]">
                  <span className="text-[var(--foreground-muted)] font-medium">Partial P&L Total</span>
                  {(() => {
                    const total = trade.partialCloses.reduce((sum, pc) => sum + (parseFloat(String(pc.pnl)) || 0), 0);
                    return (
                      <span className={cn("font-mono font-bold", total >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]")}>
                        {total >= 0 ? '+' : ''}${total.toFixed(2)}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Pending partial closes (to be submitted) */}
            {pendingPartialCloses.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-blue-400 font-medium">Pending (will save on submit):</span>
                {pendingPartialCloses.map((pc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[var(--foreground)]">{pc.quantity.toFixed(2)} lots</span>
                      <span className="text-[var(--foreground-muted)]">@</span>
                      <span className="font-mono text-[var(--foreground)]">{pc.exitPrice.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-mono font-semibold",
                        pc.pnl >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
                      )}>
                        {pc.pnl >= 0 ? '+' : ''}${pc.pnl.toFixed(2)}
                      </span>
                      <button type="button" title="Remove partial close" onClick={() => setPendingPartialCloses(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new partial close */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <label htmlFor="pcQty" className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-0.5 block">Qty (Lots)</label>
                <input
                  id="pcQty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.50"
                  value={partialCloseQty || ''}
                  onChange={(e) => setPartialCloseQty(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pcPrice" className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-0.5 block">Close Price</label>
                <input
                  id="pcPrice"
                  type="number"
                  step="0.00001"
                  placeholder="1.2345"
                  value={partialClosePrice || ''}
                  onChange={(e) => setPartialClosePrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                disabled={!partialCloseQty || !partialClosePrice || partialCloseQty <= 0 || partialClosePrice <= 0}
                onClick={() => {
                  if (partialCloseQty > 0 && partialClosePrice > 0 && formData.entryPrice) {
                    const result = calculateTradePnL({
                      type: formData.type,
                      entryPrice: formData.entryPrice,
                      exitPrice: partialClosePrice,
                      quantity: partialCloseQty,
                      symbol: formData.symbol,
                    });
                    setPendingPartialCloses(prev => [...prev, { quantity: partialCloseQty, exitPrice: partialClosePrice, pnl: result.pnl }]);
                    setPartialCloseQty(0);
                    setPartialClosePrice(0);
                  }
                }}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-md transition-all"
              >
                ADD
              </button>
            </div>

            {/* Live preview of P&L for current inputs */}
            {partialCloseQty > 0 && partialClosePrice > 0 && formData.entryPrice > 0 && (() => {
              const previewResult = calculateTradePnL({
                type: formData.type,
                entryPrice: formData.entryPrice,
                exitPrice: partialClosePrice,
                quantity: partialCloseQty,
                symbol: formData.symbol,
              });
              const previewPnl = previewResult.pnl;
              return (
                <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] px-1">
                  <span>Preview P&L:</span>
                  <span className={cn("font-mono font-bold", previewPnl >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]")}>
                    {previewPnl >= 0 ? '+' : ''}${previewPnl.toFixed(2)}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* P&L Bar (Compact) */}
        {calculatedPnL && (
          <div className="flex items-center justify-between p-2.5 bg-[var(--background-tertiary)]/50 border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">EST. P&L</span>
              <span className={cn(
                "text-sm font-mono font-bold",
                calculatedPnL.netPnL >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
              )}>
                {calculatedPnL.netPnL >= 0 ? '+' : ''}${calculatedPnL.netPnL.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">PIPS</span>
              <span className={cn(
                "text-sm font-mono font-bold",
                calculatedPnL.pips >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
              )}>
                {calculatedPnL.pips >= 0 ? '+' : ''}{calculatedPnL.pips.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Compact Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-8 text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 rounded-md transition-all hover:scale-[1.02]"
          >
            {isEditing ? 'UPDATE' : 'CREATE'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
