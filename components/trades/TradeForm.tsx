'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Trade } from '@/types'
import { calculateTradePnL, calculatePips } from '@/lib/trades'
import { z } from 'zod'
import { Plus, X, TrendingUp, TrendingDown, Calendar, Info, CheckCircle2, Target, DollarSign } from 'lucide-react'
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
        exitDate: exitDateISO,
        entryPrice: Number(finalData.entryPrice),
        exitPrice: finalData.exitPrice ? Number(finalData.exitPrice) : undefined,
        quantity: Number(finalData.quantity),
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      className="bg-background-secondary border-border p-0 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background-secondary">
        {/* Premium Header */}
        <div className="px-6 py-5 border-b border-border bg-background-tertiary/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                {isEditing ? 'REVISE TRADE' : 'CAPTURE TRADE'}
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-widest">
                  Active Session
                </span>
              </h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground-muted mt-0.5">
                Precision Entry Workflow
              </p>
            </div>
            
            {/* Direction Toggle - Ultra Premium */}
            <div className="flex p-1 bg-background-tertiary rounded-xl border border-border shadow-inner">
              <button
                type="button"
                onClick={() => updateField('type', 'BUY')}
                className={cn(
                  'px-5 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest',
                  formData.type === 'BUY'
                    ? 'bg-profit text-white shadow-lg shadow-profit/20 scale-105'
                    : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
                )}
              >
                <TrendingUp size={14} />
                Long
              </button>
              <button
                type="button"
                onClick={() => updateField('type', 'SELL')}
                className={cn(
                  'px-5 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest',
                  formData.type === 'SELL'
                    ? 'bg-loss text-white shadow-lg shadow-loss/20 scale-105'
                    : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
                )}
              >
                <TrendingDown size={14} />
                Short
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Execution Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Execution Details</span>
              </div>

              <div className="relative group">
                <label className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Symbol Asset</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <AssetIcon symbol={formData.symbol} size="sm" />
                  </div>
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
                      "w-full h-11 pl-10 pr-4 bg-background-tertiary border rounded-xl text-sm font-bold transition-all duration-200",
                      "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                      errors.symbol ? 'border-loss' : 'border-border group-hover:border-border-hover'
                    )}
                  />
                  {showSymbolDropdown && filteredSymbols.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background-secondary border border-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/20 animate-in fade-in slide-in-from-top-2">
                      {filteredSymbols.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            updateField('symbol', item.symbol)
                            setShowSymbolDropdown(false)
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-background-tertiary transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <AssetIcon symbol={item.symbol} size="sm" />
                            <span className="font-bold text-sm">{item.symbol}</span>
                          </div>
                          <span className="text-[10px] font-bold text-foreground-muted bg-background-secondary px-2 py-0.5 rounded border border-border uppercase">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label htmlFor="quantity" className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Lots (Size)</label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="0.01"
                    title="Quantity"
                    value={formData.quantity || ''}
                    onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
                    className={cn(
                      "w-full h-11 px-4 bg-background-tertiary border rounded-xl text-sm font-mono font-bold transition-all duration-200",
                      "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                      errors.quantity ? 'border-loss' : 'border-border group-hover:border-border-hover'
                    )}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Open Date</label>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                    <input
                      id="entryDate"
                      type="datetime-local"
                      title="Entry Date"
                      value={formData.entryDate}
                      onChange={(e) => updateField('entryDate', e.target.value)}
                      className="w-full h-11 pl-9 pr-3 bg-background-tertiary border border-border rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Exit */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Levels & Targets</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label htmlFor="entryPrice" className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Entry Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-xs font-bold">$</span>
                    <input
                      id="entryPrice"
                      type="number"
                      step="0.00001"
                      placeholder="0.00000"
                      title="Entry Price"
                      value={formData.entryPrice || ''}
                      onChange={(e) => updateField('entryPrice', parseFloat(e.target.value) || 0)}
                      className={cn(
                        "w-full h-11 pl-7 pr-4 bg-background-tertiary border rounded-xl text-sm font-mono font-bold transition-all duration-200",
                        "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.entryPrice ? 'border-loss' : 'border-border group-hover:border-border-hover'
                      )}
                    />
                  </div>
                </div>
                <div className="group">
                  <label htmlFor="exitPrice" className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Exit Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-xs font-bold">$</span>
                    <input
                      id="exitPrice"
                      type="number"
                      step="0.00001"
                      placeholder="Closed Price"
                      title="Exit Price"
                      value={formData.exitPrice || ''}
                      onChange={(e) => updateField('exitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full h-11 pl-7 pr-4 bg-background-tertiary border border-border rounded-xl text-sm font-mono font-bold transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 group-hover:border-border-hover"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1 text-loss-light">Stop Loss</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="S/L"
                      value={formData.stopLoss || ''}
                      onChange={(e) => updateField('stopLoss', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full h-11 px-4 bg-background-tertiary border border-border rounded-xl text-sm font-mono font-bold transition-all duration-200 border-loss/20 focus:ring-2 focus:ring-loss/10 focus:border-loss/40 group-hover:border-loss/30"
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="takeProfit" className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1 text-profit-light">Take Profit</label>
                    <input
                      id="takeProfit"
                      type="number"
                      step="0.00001"
                      placeholder="T/P"
                      title="Take Profit"
                      value={formData.takeProfit || ''}
                      onChange={(e) => updateField('takeProfit', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full h-11 px-4 bg-background-tertiary border border-border rounded-xl text-sm font-mono font-bold transition-all duration-200 border-profit/20 focus:ring-2 focus:ring-profit/10 focus:border-profit/40 group-hover:border-profit/30"
                    />
                  </div>
              </div>
            </div>
          </div>

          {/* Strategy & Analytics Section */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Info size={14} className="text-purple-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Strategy & Context</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Trading Strategy</label>
                <select
                  value={formData.strategyId}
                  title="Strategy"
                  onChange={(e) => updateField('strategyId', e.target.value)}
                  className="w-full h-11 px-4 bg-background-tertiary border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                >
                  <option value="">No Strategy</option>
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-1.5 block ml-1">Trade Notes / Journal</label>
                <textarea
                  placeholder="Describe your reasoning, confluence, or emotions..."
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full h-11 px-4 py-2.5 bg-background-tertiary border border-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Real-time Preview */}
          {calculatedPnL && (
            <div className="relative group overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 transition-all hover:bg-blue-500/10">
               <div className="absolute top-0 right-0 p-2 opacity-5">
                  <DollarSign size={80} className="text-blue-500" />
               </div>
               <div className="flex items-center justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Projected Performance</span>
                    <div className={cn(
                      "text-2xl font-black tracking-tighter mt-1",
                      calculatedPnL.netPnL >= 0 ? "text-profit-light" : "text-loss-light"
                    )}>
                      {calculatedPnL.netPnL >= 0 ? '+' : '-'}${Math.abs(calculatedPnL.netPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex gap-4 border-l border-blue-500/20 pl-4">
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black uppercase tracking-widest text-foreground-muted">Net Pips</span>
                      <span className="font-mono font-bold text-sm text-blue-400">{calculatedPnL.pips.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black uppercase tracking-widest text-foreground-muted">Gross P&L</span>
                      <span className="font-mono font-bold text-sm text-foreground">${calculatedPnL.pnl.toFixed(2)}</span>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-border bg-background-tertiary/30 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-foreground-muted" />
            <p className="text-[10px] text-foreground-muted font-bold tracking-tight">
              Fields with <span className="text-red-500">*</span> are mandatory for ledger consistency.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-border bg-background-tertiary hover:bg-background-tertiary/70"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="h-10 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-transform active:scale-95"
            >
              {isEditing ? 'UPDATE POSITION' : 'COMMIT TRADE'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

