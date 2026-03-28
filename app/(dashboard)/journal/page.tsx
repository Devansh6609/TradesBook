'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen, Clock, ChevronRight, BarChart3, Save, Loader2,
  ImagePlus, Edit2, Star, Check, Plus, X
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { api, Trade } from '@/lib/apiClient'

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'journaled', label: 'Journaled' },
  { id: 'pending', label: 'Pending' },
]

const executionItems = [
  { id: 'followed_plan', label: 'Followed plan' },
  { id: 'proper_risk', label: 'Proper risk' },
  { id: 'good_entry', label: 'Good entry' },
  { id: 'patient_exit', label: 'Patient exit' },
]

interface AnalyticsSummary {
  averageHoldTime: number
  avgWinner: string
  avgLoser: string
}

export default function JournalPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [journalData, setJournalData] = useState({
    preTradeAnalysis: '',
    postTradeAnalysis: '',
    emotions: '',
    lessonsLearned: '',
    tags: '',
    rating: 5,
    executionChecklist: [] as string[],
  })

  // Fetch trades
  const { data: tradesData, isLoading } = useQuery({
    queryKey: ['trades', 'journal', activeTab],
    queryFn: async () => {
      return api.trades.list({
        status: activeTab === 'pending' ? 'OPEN' : undefined,
        // The Worker doesn't have hasJournal filter yet, but we can filter client-side or add it.
        // For now, let's just fetch all and we'll filter below.
        limit: 100
      })
    },
  })

  // Fetch analytics for comparison
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      // Assuming /api/analytics returns the summary needed for journal
      return api.analytics.overview() as unknown as AnalyticsSummary
    },
  })

  // Save journal mutation
  const saveJournalMutation = useMutation({
    mutationFn: async (data: { tradeId: string; journal: typeof journalData }) => {
      return api.trades.update(data.tradeId, {
        preTradeAnalysis: data.journal.preTradeAnalysis,
        postTradeAnalysis: data.journal.postTradeAnalysis,
        entryEmotion: data.journal.emotions as any,
        rating: data.journal.rating,
        // executionChecklist is stored as TEXT in D1, so stringify is correct
        lessonsLearned: data.journal.lessonsLearned + (data.journal.executionChecklist.length ? `\n\nChecklist: ${data.journal.executionChecklist.join(', ')}` : ''),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      toast.success('Trade Journaled!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save journal')
    },
  })

  const trades = tradesData?.trades || []
  const selectedTrade = trades.find(t => t.id === selectedTradeId)

  const handleSelectTrade = (trade: Trade) => {
    setSelectedTradeId(trade.id)
    setJournalData({
      preTradeAnalysis: trade.preTradeAnalysis || '',
      postTradeAnalysis: trade.postTradeAnalysis || '',
      emotions: trade.entryEmotion || '',
      lessonsLearned: trade.lessonsLearned || '',
      tags: trade.tags?.map(t => t.name).join(', ') || '',
      rating: trade.rating || 5,
      executionChecklist: trade.executionChecklist ? JSON.parse(trade.executionChecklist) : [],
    })
  }

  const handleSave = () => {
    if (selectedTradeId) {
      saveJournalMutation.mutate({ tradeId: selectedTradeId, journal: journalData })
    }
  }

  const getTabCount = (tabId: string) => {
    if (tabId === 'all') return trades.length
    if (tabId === 'journaled') return trades.filter(t => t.preTradeAnalysis || t.postTradeAnalysis).length
    if (tabId === 'pending') return trades.filter(t => !t.preTradeAnalysis && !t.postTradeAnalysis).length
    return 0
  }

  const isWinner = (trade: Trade) => {
    const pnlValue = trade.netPnl ?? trade.pnl ?? 0
    return pnlValue > 0
  }

  const formatPnl = (trade: Trade) => {
    const pnlValue = trade.netPnl ?? trade.pnl
    if (pnlValue === null || pnlValue === undefined) return '-'
    return `${pnlValue >= 0 ? '+' : ''}$${Math.abs(pnlValue).toFixed(2)}`
  }

  const isJournaled = (trade: Trade) => {
    return !!(trade.preTradeAnalysis || trade.postTradeAnalysis || trade.lessonsLearned)
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)

    if (d > 0) return `${d}d ${h % 24}h`
    if (h > 0) return `${h}h ${m % 60}m`
    if (m > 0) return `${m}m ${Math.floor(seconds % 60)}s`
    return `${Math.floor(seconds)}s`
  }

  const toggleExecutionItem = (itemId: string) => {
    setJournalData(prev => ({
      ...prev,
      executionChecklist: prev.executionChecklist.includes(itemId)
        ? prev.executionChecklist.filter(id => id !== itemId)
        : [...prev.executionChecklist, itemId]
    }))
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel - Trade List */}
      <div className="w-[360px] flex-shrink-0 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Trade Journal</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                <Clock size={12} />
                Live
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
                {trades.length} entries
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-1.5 py-0.5 text-xs rounded",
                  activeTab === tab.id
                    ? "bg-white/20"
                    : "bg-[var(--background-tertiary)]"
                )}>
                  {getTabCount(tab.id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Trade List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <BookOpen className="w-12 h-12 text-[var(--foreground-muted)] mb-3" />
              <p className="text-[var(--foreground-muted)]">No trades yet</p>
              <p className="text-sm text-[var(--foreground-disabled)] mt-1">Add trades to start journaling</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {trades.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => handleSelectTrade(trade)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all",
                    selectedTradeId === trade.id
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "hover:bg-white/5"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span className="font-semibold text-[var(--foreground)]">{trade.symbol}</span>
                        {!isJournaled(trade) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className={cn(
                          trade.type === 'BUY' ? "text-green-400" : "text-red-400"
                        )}>
                          {trade.type === 'BUY' ? 'Long' : 'Short'}
                        </span>
                        <span className="text-[var(--foreground-muted)]">${trade.entryPrice}</span>
                        <span className={cn(
                          "font-medium",
                          isWinner(trade) ? "text-green-400" : "text-red-400"
                        )}>
                          {formatPnl(trade)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        {format(new Date(trade.entryDate), 'MMM d, yyyy, HH:mm')}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-[var(--foreground-muted)] mt-2" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Trade Details & Journal Form */}
      <div className="flex-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden">
        {selectedTrade ? (
          <>
            {/* Trade Header */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedTrade.symbol}</h2>
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-bold rounded",
                        isWinner(selectedTrade)
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {isWinner(selectedTrade) ? 'WINNER' : 'LOSER'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      {selectedTrade.type === 'BUY' ? 'Long' : 'Short'} · Entry ${selectedTrade.entryPrice} ·
                      Size {selectedTrade.quantity} · {format(new Date(selectedTrade.entryDate), 'MMM d, yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2 text-[var(--foreground-muted)]" title="View history">
                    <Clock size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-[var(--foreground-muted)]">
                    <BarChart3 size={16} />
                    Analytics
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSave}
                    disabled={saveJournalMutation.isPending}
                  >
                    {saveJournalMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Journal Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Pre-Trade Analysis */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] mb-2">
                  <BookOpen size={14} />
                  PRE-TRADE ANALYSIS
                </label>
                <textarea
                  value={journalData.preTradeAnalysis}
                  onChange={(e) => setJournalData({ ...journalData, preTradeAnalysis: e.target.value })}
                  placeholder="What did you see? Plan, thesis, levels, risk..."
                  className="w-full h-24 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Post-Trade Review */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] mb-2">
                  <Check size={14} />
                  POST-TRADE REVIEW
                </label>
                <textarea
                  value={journalData.postTradeAnalysis}
                  onChange={(e) => setJournalData({ ...journalData, postTradeAnalysis: e.target.value })}
                  placeholder="What happened? Execution, slippage, improvements..."
                  className="w-full h-24 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Emotions & Lessons - Two Column */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] mb-2">
                    😊 EMOTIONS
                  </label>
                  <textarea
                    value={journalData.emotions}
                    onChange={(e) => setJournalData({ ...journalData, emotions: e.target.value })}
                    placeholder="Calm, anxious, FOMO, confident..."
                    className="w-full h-20 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] mb-2">
                    <BookOpen size={14} />
                    LESSONS LEARNED
                  </label>
                  <textarea
                    value={journalData.lessonsLearned}
                    onChange={(e) => setJournalData({ ...journalData, lessonsLearned: e.target.value })}
                    placeholder="Key takeaways to repeat or avoid..."
                    className="w-full h-20 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Tags & Rating - Two Column */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] mb-2">
                    🏷️ TAGS
                  </label>
                  <input
                    type="text"
                    value={journalData.tags}
                    onChange={(e) => setJournalData({ ...journalData, tags: e.target.value })}
                    placeholder="breakout, trend, news (comma separated)"
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                      <Star size={14} />
                      RATING
                    </label>
                    <span className="text-sm font-medium text-[var(--foreground)]">{journalData.rating}/10</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--foreground-muted)]">1</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={journalData.rating}
                      onChange={(e) => setJournalData({ ...journalData, rating: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <span className="text-xs text-[var(--foreground-muted)]">10</span>
                  </div>
                </div>
              </div>

              {/* Execution Checklist */}
              <div>
                <label className="text-xs font-medium text-[var(--foreground-muted)] mb-3 block">
                  EXECUTION CHECKLIST
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {executionItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleExecutionItem(item.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-sm",
                        journalData.executionChecklist.includes(item.id)
                          ? "bg-blue-600/20 border-blue-500/50 text-[var(--foreground)]"
                          : "bg-[var(--input-bg)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        journalData.executionChecklist.includes(item.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-[var(--border)]"
                      )}>
                        {journalData.executionChecklist.includes(item.id) && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                      {item.label}
                    </button>
                  ))}
                  <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)] transition-all text-sm">
                    Add custom item
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] mb-3">
                  📸 SCREENSHOTS
                </label>
                <button className="w-32 h-24 flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)] transition-colors">
                  <Plus size={20} />
                  <span className="text-xs">Add Image</span>
                </button>
              </div>

              {/* Trade Summary Card */}
              <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">💰</span>
                  <span className="font-semibold text-[var(--foreground)]">{selectedTrade.symbol}</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                    {selectedTrade.type === 'BUY' ? 'LONG' : 'SHORT'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)] mb-0.5">ENTRY</p>
                    <p className="text-lg font-semibold text-[var(--foreground)]">${selectedTrade.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)] mb-0.5">EXIT</p>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {selectedTrade.exitPrice ? `$${selectedTrade.exitPrice}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)] mb-0.5">P&L</p>
                    <p className={cn(
                      "text-lg font-semibold",
                      isWinner(selectedTrade) ? "text-green-400" : "text-red-400"
                    )}>
                      {formatPnl(selectedTrade)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Analysis - NEW */}
              {selectedTrade.status === 'CLOSED' && analyticsData && (
                <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[var(--foreground-muted)] mb-3 uppercase tracking-wider">
                    Performance Analysis
                  </h3>
                  <div className="space-y-4">
                    {/* Duration Comparison */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--foreground-muted)]">Duration</span>
                        <span className="text-[var(--foreground)]">
                          {selectedTrade.exitDate && selectedTrade.entryDate
                            ? formatDuration((new Date(selectedTrade.exitDate).getTime() - new Date(selectedTrade.entryDate).getTime()) / 1000)
                            : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--background-tertiary)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{
                            width: `${Math.min((((new Date(selectedTrade.exitDate || '').getTime() - new Date(selectedTrade.entryDate).getTime()) / (1000 * 60 * 60)) / (analyticsData.averageHoldTime || 1)) * 50, 100)}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
                        <span>vs Avg: {formatDuration((analyticsData.averageHoldTime || 0) * 3600)}</span>
                      </div>
                    </div>

                    {/* P&L Comparison */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--foreground-muted)]">Result vs Average</span>
                        <span className={cn(isWinner(selectedTrade) ? "text-green-400" : "text-red-400")}>
                          {formatPnl(selectedTrade)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
                        <span>
                          Avg {isWinner(selectedTrade) ? "Winner" : "Loser"}:
                          <span className={cn(isWinner(selectedTrade) ? "text-green-500 ml-1" : "text-red-500 ml-1")}>
                            ${Math.abs(parseFloat(isWinner(selectedTrade) ? analyticsData.avgWinner : analyticsData.avgLoser)).toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Placeholder */}
              <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-[var(--foreground-muted)] mb-3" />
                  <h3 className="text-[var(--foreground)] font-medium mb-1">Chart Not Available</h3>
                  <p className="text-sm text-[var(--foreground-muted)] max-w-sm">
                    This trade was added manually. Connect a trading account to view real-time charts for your trades.
                  </p>
                </div>
              </div>

              {/* Manual Entry Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-sm bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] flex items-center gap-2">
                  <Edit2 size={14} />
                  Manual Entry
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Select a trade to journal</h3>
            <p className="text-[var(--foreground-muted)] max-w-sm">
              Click on any trade from the list to view and edit your detailed notes, screenshots, and trading insights.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
