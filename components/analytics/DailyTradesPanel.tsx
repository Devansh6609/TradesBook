'use client'

import { format } from 'date-fns'
import { X, TrendingUp, TrendingDown, FileText, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Trade } from '@/lib/apiClient'

interface DailyTradesPanelProps {
  date: Date
  trades: Trade[]
  onClose: () => void
}

export function DailyTradesPanel({ date, trades, onClose }: DailyTradesPanelProps) {
  const totalPnl = trades.reduce((acc, t) => acc + (t.netPnl || 0), 0)
  const winningTrades = trades.filter(t => (t.netPnl || 0) > 0).length
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0

  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden font-inter">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <FileText size={16} />
          </div>
          <h3 className="text-sm font-black text-white font-jakarta tracking-tight">Trades on {format(date, 'MMM dd')}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all border border-white/5 bg-white/[0.02]"
          title="Close Panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-10 pb-6 border-b border-white/5 relative z-10">
        <div className="space-y-1">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total P&L</p>
          <p className={cn(
            "text-base font-black font-jakarta tabular-nums tracking-tight",
            totalPnl >= 0 ? "text-blue-500" : "text-red-500"
          )}>
            {totalPnl >= 0 ? '' : '-'}{formatCurrency(totalPnl)}
          </p>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Trades</p>
          <p className="text-base font-black text-white font-jakarta tracking-tight">
            {trades.length}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Win Rate</p>
          <p className="text-base font-black text-white font-jakarta tracking-tight">
            {winRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative z-10 pb-4">
        {trades.length > 0 ? (
          trades.map((t) => {
            const isWin = (t.netPnl || 0) >= 0
            return (
              <div 
                key={t.id} 
                className="group/item flex flex-col gap-3 bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
                      isWin 
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-500" 
                        : "bg-red-500/10 border-red-500/20 text-red-500"
                    )}>
                      {isWin ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-white font-jakarta tracking-tight">{t.symbol}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                          t.type === 'BUY' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {t.type === 'BUY' ? 'LONG' : 'SHORT'}
                        </span>
                        <p className="text-[10px] font-bold text-white/20">
                          {t.quantity} @ {t.entryPrice?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[13px] font-black font-jakarta tabular-nums tracking-tight",
                      isWin ? "text-blue-500" : "text-red-500"
                    )}>
                      {isWin ? '+' : '-'}{formatCurrency(Math.abs(t.netPnl || 0))}
                    </p>
                    <p className="text-[9px] font-bold text-white/10 mt-0.5 uppercase tracking-tighter">
                      ROI {(t.pnlPercentage || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20 grayscale">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Activity size={32} strokeWidth={1} className="text-white/40" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">No Operations Recorded</p>
            <p className="text-[9px] font-bold mt-2 text-white/20 max-w-[150px]">No trading activity found for this observation date</p>
          </div>
        )}
      </div>
    </div>
  )
}
