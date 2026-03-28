'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    ChevronDown,
    Edit2,
    Loader2,
    BookOpen,
    Star,
    LineChart,
    Lightbulb,
    BarChart3,
    Clock,
    TrendingUp,
    TrendingDown,
} from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { TradeChart } from '@/components/analytics/TradeChart'

interface Trade {
    id: string
    symbol: string
    type: 'BUY' | 'SELL'
    entryPrice: string
    exitPrice?: string
    quantity: string
    pnl?: string
    netPnl?: string
    status: 'OPEN' | 'CLOSED'
    entryDate: string
    exitDate?: string
    preTradeAnalysis?: string
    postTradeReview?: string
    emotions?: string
    lessonsLearned?: string
    rating?: number
}

interface AnalyticsData {
    avgWinner: string
    avgLoser: string
    averageHoldTime?: number
}

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'winners', label: 'Winners' },
    { id: 'losers', label: 'Losers' },
]

const timeFilters = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
]

const sortOptions = [
    { value: 'date', label: 'By Date' },
    { value: 'pnl', label: 'By P&L' },
    { value: 'symbol', label: 'By Symbol' },
]

export default function TradeAnalysisPage() {
    const [activeTab, setActiveTab] = useState('all')
    const [timeFilter, setTimeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('date')
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)

    // Fetch trades
    const { data: tradesData, isLoading } = useQuery<{ trades: Trade[] }>({
        queryKey: ['trades', 'analysis', activeTab, timeFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('limit', '100')
            if (activeTab === 'winners') params.append('pnlFilter', 'positive')
            if (activeTab === 'losers') params.append('pnlFilter', 'negative')
            const res = await fetch(`/api/trades?${params}`)
            if (!res.ok) throw new Error('Failed to fetch trades')
            return res.json()
        },
    })

    // Fetch analytics for comparison
    const { data: analyticsData } = useQuery<AnalyticsData>({
        queryKey: ['analytics', 'summary'],
        queryFn: async () => {
            const res = await fetch('/api/analytics')
            if (!res.ok) throw new Error('Failed to fetch analytics')
            return res.json()
        },
    })

    const trades = tradesData?.trades || []
    const closedTrades = trades.filter(t => t.status === 'CLOSED')

    // Filter and sort trades
    const filteredTrades = useMemo(() => {
        let result = [...closedTrades]

        // Sort
        if (sortBy === 'date') {
            result.sort((a, b) => new Date(b.exitDate || b.entryDate).getTime() - new Date(a.exitDate || a.entryDate).getTime())
        } else if (sortBy === 'pnl') {
            result.sort((a, b) => parseFloat(b.netPnl || b.pnl || '0') - parseFloat(a.netPnl || a.pnl || '0'))
        } else if (sortBy === 'symbol') {
            result.sort((a, b) => a.symbol.localeCompare(b.symbol))
        }

        return result
    }, [closedTrades, sortBy])

    const selectedTrade = filteredTrades.find(t => t.id === selectedTradeId)

    const getTabCount = (tabId: string) => {
        if (tabId === 'all') return closedTrades.length
        if (tabId === 'winners') return closedTrades.filter(t => parseFloat(t.netPnl || t.pnl || '0') > 0).length
        if (tabId === 'losers') return closedTrades.filter(t => parseFloat(t.netPnl || t.pnl || '0') < 0).length
        return 0
    }

    const isWinner = (trade: Trade) => {
        const pnl = parseFloat(trade.netPnl || trade.pnl || '0')
        return pnl > 0
    }

    const formatPnl = (trade: Trade) => {
        const pnl = parseFloat(trade.netPnl || trade.pnl || '0')
        return `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}`
    }

    const formatCurrency = (value: string | number | undefined) => {
        if (value === undefined) return '$0.00'
        const num = typeof value === 'string' ? parseFloat(value) : value
        return `$${Math.abs(num).toFixed(2)}`
    }

    // Calculate trade quality score (0-100)
    const calculateTradeQuality = (trade: Trade) => {
        let score = 0
        const breakdown = {
            profitability: 0,
            execution: 0,
            journal: 0,
            rating: 0,
        }

        // Profitability (30 pts max)
        const pnl = parseFloat(trade.netPnl || trade.pnl || '0')
        if (pnl > 0) {
            breakdown.profitability = 30
        } else if (pnl === 0) {
            breakdown.profitability = 15
        }
        score += breakdown.profitability

        // Execution (40 pts max) - based on having stop loss, take profit, proper entry
        // For now, give 0 if missing execution data
        breakdown.execution = 0
        score += breakdown.execution

        // Journal (20 pts max) - 5 pts each for pre-analysis, post-review, emotions, lessons
        if (trade.preTradeAnalysis) breakdown.journal += 5
        if (trade.postTradeReview) breakdown.journal += 5
        if (trade.emotions) breakdown.journal += 5
        if (trade.lessonsLearned) breakdown.journal += 5
        score += breakdown.journal

        // Rating (10 pts max)
        if (trade.rating) {
            breakdown.rating = trade.rating
            score += trade.rating
        }

        return { score, breakdown }
    }

    // Calculate trade duration
    const calculateDuration = (trade: Trade) => {
        if (!trade.exitDate) return null
        const minutes = differenceInMinutes(new Date(trade.exitDate), new Date(trade.entryDate))
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    // Calculate price move percentage
    const calculatePriceMove = (trade: Trade) => {
        if (!trade.exitPrice) return null
        const entry = parseFloat(trade.entryPrice)
        const exit = parseFloat(trade.exitPrice)
        const move = ((exit - entry) / entry) * 100
        const adjustedMove = trade.type === 'SELL' ? -move : move
        return adjustedMove
    }

    // Compare with average
    const compareWithAverage = (trade: Trade) => {
        const tradePnl = parseFloat(trade.netPnl || trade.pnl || '0')
        const avgWinner = parseFloat(analyticsData?.avgWinner || '0')

        let vsAvg = 0
        if (avgWinner > 0 && tradePnl > 0) {
            vsAvg = ((tradePnl - avgWinner) / avgWinner) * 100
        }

        return { vsAvg }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Left Panel - Trade List */}
            <div className="w-[380px] flex-shrink-0 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Trade Analysis</h2>
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
                            {filteredTrades.length} trades
                        </span>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4">
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
                                    activeTab === tab.id ? "bg-white/20" : "bg-[var(--background-tertiary)]"
                                )}>
                                    {getTabCount(tab.id)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <select
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {timeFilters.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {sortOptions.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Trade List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredTrades.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <BarChart3 className="w-12 h-12 text-[var(--foreground-muted)] mb-3" />
                            <p className="text-[var(--foreground-muted)]">No trades found</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredTrades.map((trade) => {
                                const hasJournal = trade.preTradeAnalysis || trade.postTradeReview
                                return (
                                    <button
                                        key={trade.id}
                                        onClick={() => setSelectedTradeId(trade.id)}
                                        className={cn(
                                            "w-full p-3 rounded-lg text-left transition-all",
                                            selectedTradeId === trade.id
                                                ? "bg-blue-600/20 border border-blue-500/30"
                                                : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">💰</span>
                                                <span className="font-semibold text-[var(--foreground)]">{trade.symbol}</span>
                                                {!hasJournal && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
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
                                            {format(new Date(trade.entryDate), 'MMM d, hh:mm a')}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Trade Details */}
            <div className="flex-1 overflow-y-auto">
                {selectedTrade ? (
                    <div className="space-y-4">
                        {/* Trade Header */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">💰</span>
                                        <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedTrade.symbol}</h2>
                                        <span className={cn(
                                            "px-2 py-0.5 text-xs font-bold rounded",
                                            isWinner(selectedTrade)
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-red-500/20 text-red-400"
                                        )}>
                                            {isWinner(selectedTrade) ? 'WINNER' : 'LOSER'}
                                        </span>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                                            Score: {calculateTradeQuality(selectedTrade).score}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {selectedTrade.type === 'BUY' ? 'Long' : 'Short'} · {format(new Date(selectedTrade.entryDate), 'MMM d, hh:mm a')} · Duration: {calculateDuration(selectedTrade) || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[var(--foreground-muted)] mb-1">P&L</p>
                                    <p className={cn(
                                        "text-2xl font-bold",
                                        isWinner(selectedTrade) ? "text-green-400" : "text-red-400"
                                    )}>
                                        {formatPnl(selectedTrade)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Trade Stats Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
                                <p className="text-xs text-[var(--foreground-muted)] mb-1">ENTRY PRICE</p>
                                <p className="text-lg font-semibold text-[var(--foreground)]">{selectedTrade.entryPrice}</p>
                            </div>
                            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
                                <p className="text-xs text-[var(--foreground-muted)] mb-1">EXIT PRICE</p>
                                <p className="text-lg font-semibold text-[var(--foreground)]">{selectedTrade.exitPrice || '-'}</p>
                            </div>
                            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
                                <p className="text-xs text-[var(--foreground-muted)] mb-1">QUANTITY</p>
                                <p className="text-lg font-semibold text-[var(--foreground)]">{selectedTrade.quantity}</p>
                            </div>
                            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
                                <p className="text-xs text-[var(--foreground-muted)] mb-1">PRICE MOVE</p>
                                <p className={cn(
                                    "text-lg font-semibold",
                                    (calculatePriceMove(selectedTrade) || 0) >= 0 ? "text-green-400" : "text-red-400"
                                )}>
                                    {calculatePriceMove(selectedTrade) !== null
                                        ? `${(calculatePriceMove(selectedTrade) || 0) >= 0 ? '+' : ''}${calculatePriceMove(selectedTrade)?.toFixed(2)}%`
                                        : '-'
                                    }
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

                        <div className="grid grid-cols-2 gap-4">
                            {/* Journal Entry Section */}
                            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                        <h3 className="font-semibold text-[var(--foreground)]">Journal Entry</h3>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 text-xs font-medium rounded",
                                        (selectedTrade.preTradeAnalysis || selectedTrade.postTradeReview)
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-amber-500/20 text-amber-400"
                                    )}>
                                        {(selectedTrade.preTradeAnalysis || selectedTrade.postTradeReview) ? 'Journaled' : 'Not Journaled'}
                                    </span>
                                </div>

                                {(selectedTrade.preTradeAnalysis || selectedTrade.postTradeReview) ? (
                                    <div className="space-y-3">
                                        {selectedTrade.preTradeAnalysis && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Pre-Trade Analysis</p>
                                                <p className="text-sm text-gray-300">{selectedTrade.preTradeAnalysis}</p>
                                            </div>
                                        )}
                                        {selectedTrade.postTradeReview && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Post-Trade Review</p>
                                                <p className="text-sm text-gray-300">{selectedTrade.postTradeReview}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 text-sm mb-4">No journal entry for this trade</p>
                                        <Link href={`/journal?trade=${selectedTrade.id}`}>
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                Add Journal Entry
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Trade Quality Score */}
                            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-5 h-5 text-amber-400" />
                                    <h3 className="font-semibold text-[var(--foreground)]">Trade Quality</h3>
                                </div>

                                {(() => {
                                    const { score, breakdown } = calculateTradeQuality(selectedTrade)
                                    return (
                                        <div className="flex gap-6">
                                            {/* Circular Progress */}
                                            <div className="relative w-20 h-20">
                                                <svg className="w-20 h-20 -rotate-90">
                                                    <circle
                                                        cx="40"
                                                        cy="40"
                                                        r="34"
                                                        stroke="#1e293b"
                                                        strokeWidth="6"
                                                        fill="none"
                                                    />
                                                    <circle
                                                        cx="40"
                                                        cy="40"
                                                        r="34"
                                                        stroke={score >= 80 ? '#22c55e' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'}
                                                        strokeWidth="6"
                                                        fill="none"
                                                        strokeDasharray={`${(score / 100) * 213} 213`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[var(--foreground)]">
                                                    {score}
                                                </span>
                                            </div>

                                            {/* Breakdown */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[var(--foreground-muted)]">Profitability</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(breakdown.profitability / 30) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[var(--foreground-muted)] text-xs w-10 text-right">{breakdown.profitability}/30</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[var(--foreground-muted)]">Execution</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(breakdown.execution / 40) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[var(--foreground-muted)] text-xs w-10 text-right">{breakdown.execution}/40</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[var(--foreground-muted)]">Journal</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(breakdown.journal / 20) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[var(--foreground-muted)] text-xs w-10 text-right">{breakdown.journal}/20</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[var(--foreground-muted)]">Rating</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(breakdown.rating / 10) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[var(--foreground-muted)] text-xs w-10 text-right">{breakdown.rating}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* Score Badges */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">80+ Excellent</span>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">60+ Good</span>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">40+ Average</span>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded">&lt;40 Needs Work</span>
                                </div>
                            </div>
                        </div>

                        {/* Trade Simulation */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <LineChart className="w-5 h-5 text-blue-400" />
                                <h3 className="font-semibold text-[var(--foreground)]">Trade Simulation</h3>
                            </div>

                            {/* Trade Summary Card */}
                            <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-lg">💰</span>
                                    <span className="font-semibold text-[var(--foreground)]">{selectedTrade.symbol}</span>
                                    <span className={cn(
                                        "px-2 py-0.5 text-xs font-medium rounded",
                                        selectedTrade.type === 'BUY'
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                    )}>
                                        {selectedTrade.type === 'BUY' ? 'LONG' : 'SHORT'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-1">ENTRY</p>
                                        <p className="text-lg font-semibold text-[var(--foreground)]">${selectedTrade.entryPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-1">EXIT</p>
                                        <p className="text-lg font-semibold text-[var(--foreground)]">${selectedTrade.exitPrice || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">P&L</p>
                                        <p className={cn(
                                            "text-lg font-semibold",
                                            isWinner(selectedTrade) ? "text-green-400" : "text-red-400"
                                        )}>
                                            {formatPnl(selectedTrade)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Integration */}
                            <div className="mt-4">
                                <TradeChart trade={selectedTrade as any} height={450} />
                            </div>
                        </div>

                        {/* Insights Section */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-amber-400" />
                                    <h3 className="font-semibold text-[var(--foreground)]">Insights</h3>
                                </div>
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                                    COMING SOON
                                </span>
                            </div>

                            <div className="bg-[var(--input-bg)] rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    <span className="font-medium text-[var(--foreground)]">AI-Powered Insights</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Get personalized trading insights and pattern analysis.
                                </p>
                            </div>
                        </div>

                        {/* vs Your Average */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                <h3 className="font-semibold text-[var(--foreground)]">vs Your Average</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--input-bg)] rounded-lg p-4">
                                    <p className="text-xs text-[var(--foreground-muted)] mb-1">VS AVG WINNER</p>
                                    <p className={cn(
                                        "text-xl font-bold",
                                        isWinner(selectedTrade) ? "text-green-400" : "text-red-400"
                                    )}>
                                        {formatPnl(selectedTrade)}
                                    </p>
                                    <p className="text-sm text-green-400 mt-1">
                                        {compareWithAverage(selectedTrade).vsAvg >= 0 ? '+' : ''}{compareWithAverage(selectedTrade).vsAvg.toFixed(0)}%
                                    </p>
                                </div>
                                <div className="bg-[var(--input-bg)] rounded-lg p-4">
                                    <p className="text-xs text-[var(--foreground-muted)] mb-1">HOLD DURATION</p>
                                    <p className="text-xl font-bold text-[var(--foreground)]">
                                        {calculateDuration(selectedTrade) || 'N/A'}
                                    </p>
                                    <p className="text-sm text-green-400 mt-1">+0%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
                        <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <BarChart3 className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Select a trade to analyze</h3>
                        <p className="text-[var(--foreground-muted)] max-w-sm">
                            Click on any trade from the list to view detailed analysis, trade quality score, and performance metrics.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
