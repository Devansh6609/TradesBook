'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Trade } from '@/types'
import { calculateTradePnL, calculatePips } from '@/lib/trades'
import { z } from 'zod'
import { Plus, X, TrendingUp, TrendingDown, Calendar, Info, CheckCircle2, Target, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, isValid } from 'date-fns'
import { AssetIcon } from "@/components/market/AssetIcon"
import { DateTimePicker } from "@/components/ui/DatePicker"
import { ChevronDown, ChevronUp } from "lucide-react"

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

const SYMBOL_SUGGESTIONS = [
  { symbol: 'XAUUSD', description: 'Gold vs US Dollar' },
  { symbol: 'EURUSD', description: 'Euro vs US Dollar' },
  { symbol: 'GBPUSD', description: 'British Pound vs US Dollar' },
  { symbol: 'USDJPY', description: 'US Dollar vs Japanese Yen' },
  { symbol: 'USDCHF', description: 'US Dollar vs Swiss Franc' },
  { symbol: 'AUDUSD', description: 'Australian Dollar vs US Dollar' },
  { symbol: 'BTCUSD', description: 'Bitcoin vs US Dollar' },
  { symbol: 'ETHUSD', description: 'Ethereum vs US Dollar' },
  { symbol: 'US30', description: 'Dow Jones Index' },
  { symbol: 'NAS100', description: 'Nasdaq 100 Index' },
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
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  
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

  const filteredSymbols = useMemo(() => {
    if (!formData.symbol) return []
    const search = formData.symbol.toUpperCase()
    return SYMBOL_SUGGESTIONS.filter(s =>
      s.symbol.includes(search) || s.description.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5)
  }, [formData.symbol])

  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol,
        type: trade.type,
        entryPrice: parseFloat(trade.entryPrice?.toString() || '0'),
        exitPrice: trade.exitPrice ? parseFloat(trade.exitPrice.toString()) : undefined,
        entryDate: trade.entryDate ? new Date(trade.entryDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().slice(0, 16) : undefined,
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
  }, [trade, isOpen])

  useEffect(() => {
    if (formData.exitPrice && formData.entryPrice && formData.quantity && formData.symbol) {
      const result = calculateTradePnL({
        type: formData.type,
        entryPrice: formData.entryPrice,
        exitPrice: formData.exitPrice,
        quantity: formData.quantity,
        symbol: formData.symbol,
        commission: formData.commission,
        swap: formData.swap,
        fees: formData.fees,
      })
      const pips = calculatePips(formData.symbol, formData.entryPrice, formData.exitPrice, formData.type)
      setCalculatedPnL({ pnl: result.pnl, netPnL: result.netPnL, pips })
    } else {
      setCalculatedPnL(null)
    }
  }, [formData])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.symbol.trim()) newErrors.symbol = 'Required'
    if (!formData.entryPrice || formData.entryPrice <= 0) newErrors.entryPrice = 'Required'
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateField = <K extends keyof TradeFormData>(field: K, value: TradeFormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      if (field === 'exitPrice' && value && (value as number) > 0) {
        newData.status = 'CLOSED'
        if (!prev.exitDate) newData.exitDate = new Date().toISOString().slice(0, 16)
      }
      return newData
    })
    if (errors[field]) setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const finalData = { ...formData }
      const entryDateISO = new Date(finalData.entryDate).toISOString()
      const exitDateISO = finalData.exitDate ? new Date(finalData.exitDate).toISOString() : undefined

      onSubmit({
        ...finalData,
        entryDate: entryDateISO,
        exitDate: exitDateISO || null,
        entryPrice: Number(finalData.entryPrice),
        exitPrice: finalData.exitPrice ? Number(finalData.exitPrice) : null,
        quantity: Number(finalData.quantity),
        stopLoss: finalData.stopLoss ? Number(finalData.stopLoss) : null,
        takeProfit: finalData.takeProfit ? Number(finalData.takeProfit) : null,
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showCloseButton={false}
      size="md"
      className="bg-[#0c0c0c] border border-white/5 p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-[#0c0c0c]">
        {/* Header from Screenshot */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-500 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <Plus size={16} strokeWidth={3} />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {isEditing ? 'Edit Trade' : 'Add Trade'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1 rounded-lg hover:bg-white/5 text-foreground-disabled/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[85vh] custom-scrollbar">
          {/* Long/Short Toggle */}
          <div className="p-0.5 bg-[#1a1a1a] rounded-lg flex border border-white/5">
            <button
              type="button"
              onClick={() => updateField('type', 'BUY')}
              className={cn(
                'flex-1 py-1 rounded-md transition-all flex items-center justify-center gap-2 text-[10px] font-bold',
                formData.type === 'BUY'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-foreground-disabled/60 hover:text-white'
              )}
            >
              <TrendingUp size={12} />
              Long
            </button>
            <button
              type="button"
              onClick={() => updateField('type', 'SELL')}
              className={cn(
                'flex-1 py-1 rounded-md transition-all flex items-center justify-center gap-2 text-[10px] font-bold',
                formData.type === 'SELL'
                  ? 'bg-red-600/90 text-white shadow-lg'
                  : 'text-foreground-disabled/60 hover:text-white'
              )}
            >
              <TrendingDown size={12} />
              Short
            </button>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Symbol</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="E.G. XAUUSD"
                  value={formData.symbol}
                  onChange={(e) => {
                    updateField('symbol', e.target.value.toUpperCase())
                    setShowSymbolDropdown(true)
                  }}
                  onFocus={() => setShowSymbolDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                  className={cn(
                    "w-full h-9 px-3 bg-[#111111] border border-white/5 text-[11px] font-medium tracking-wide transition-all rounded-lg focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/10",
                    errors.symbol && 'border-red-500/50'
                  )}
                />
                {showSymbolDropdown && filteredSymbols.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden backdrop-blur-3xl">
                    {filteredSymbols.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          updateField('symbol', item.symbol)
                          setShowSymbolDropdown(false)
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <AssetIcon symbol={item.symbol} size="xs" />
                        <span className="font-bold text-[10px] text-white">{item.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                placeholder="Lots"
                value={formData.quantity || ''}
                onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
                className={cn(
                  "w-full h-9 px-3 bg-[#111111] border border-white/5 text-[11px] font-medium rounded-lg focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/10",
                  errors.quantity && 'border-red-500/50'
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Entry Price</label>
              <input
                type="number"
                step="0.00001"
                placeholder="0.00"
                value={formData.entryPrice || ''}
                onChange={(e) => updateField('entryPrice', parseFloat(e.target.value) || 0)}
                className={cn(
                  "w-full h-9 px-3 bg-[#111111] border border-white/5 text-[11px] font-medium rounded-lg focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/10",
                  errors.entryPrice && 'border-red-500/50'
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Exit Price</label>
              <input
                type="number"
                step="0.00001"
                placeholder="Optional"
                value={formData.exitPrice || ''}
                onChange={(e) => updateField('exitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full h-9 px-3 bg-[#111111] border border-white/5 text-[11px] font-medium rounded-lg focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Entry Date</label>
              <DateTimePicker
                value={formData.entryDate ? new Date(formData.entryDate) : null}
                onChange={(date) => updateField('entryDate', date ? date.toISOString() : new Date().toISOString())}
                className="w-full h-9 rounded-lg bg-[#111111] border border-white/5 hover:border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Exit Date</label>
              <DateTimePicker
                value={formData.exitDate ? new Date(formData.exitDate) : null}
                onChange={(date) => updateField('exitDate', date ? date.toISOString() : undefined)}
                placeholder="Optional"
                className="w-full h-9 rounded-lg bg-[#111111] border border-white/5 hover:border-white/10"
              />
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Checklist */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsChecklistOpen(!isChecklistOpen)}
              className="flex items-center gap-2 group transition-all"
            >
              <ChevronDown size={12} className={cn("text-foreground-disabled/40 transition-transform", isChecklistOpen && "rotate-180")} />
              <span className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest group-hover:text-white">Pre-Trade Checklist (Optional)</span>
            </button>
            
            {isChecklistOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-foreground-disabled/40 uppercase ml-1">Market</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Trending', value: 'TRENDING_UP' },
                      { label: 'Ranging', value: 'RANGING' },
                      { label: 'Volatile', value: 'VOLATILE' }
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateField('marketCondition', value)}
                        className={cn(
                          "px-2 py-1 rounded text-[9px] font-bold uppercase transition-all",
                          formData.marketCondition === value
                            ? "bg-blue-600 text-white"
                            : "bg-[#111111] text-foreground-disabled hover:bg-white/5 border border-white/5"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-foreground-disabled/40 uppercase ml-1">Mindset</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Confident', value: 'CONFIDENT' },
                      { label: 'Fear', value: 'FEARFUL' },
                      { label: 'Neutral', value: 'NEUTRAL' }
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateField('entryEmotion', value)}
                        className={cn(
                          "px-2 py-1 rounded text-[9px] font-bold uppercase transition-all",
                          formData.entryEmotion === value
                            ? "bg-blue-600 text-white"
                            : "bg-[#111111] text-foreground-disabled hover:bg-white/5 border border-white/5"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1">Notes</label>
            <textarea
              placeholder="Trade rationale, entry/exit notes..."
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="w-full h-24 px-3 py-2 bg-[#111111] border border-white/5 rounded-lg text-[11px] font-medium focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/10 resize-none transition-all placeholder:text-foreground-disabled/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-end gap-5 bg-[#0c0c0c]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[10px] font-bold text-foreground-disabled/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            isLoading={loading}
            className="h-9 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wide shadow-lg shadow-blue-600/20 transition-all border border-blue-400/10"
          >
            Save Trade
          </Button>
        </div>
      </form>
    </Modal>
  )
}

