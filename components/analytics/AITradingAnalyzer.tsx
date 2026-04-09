'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
    Brain, TrendingUp, TrendingDown, AlertTriangle, Target,
    Lightbulb, RefreshCw, ChevronLeft, Clock, Award,
    Shield, BarChart3, Zap, Eye, AlertCircle, CheckCircle2,
    Loader2, ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, Trash2
} from 'lucide-react'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface TradeData {
    symbol: string
    type: "BUY" | "SELL"
    pnl: number
    netPnl?: number
    entryDate: string
    exitDate?: string
    quantity: number
    entryEmotion?: string
    exitEmotion?: string
    marketCondition?: string
    strategyId?: string
    strategyName?: string
    preTradeAnalysis?: string
    postTradeAnalysis?: string
    lessonsLearned?: string
    rMultiple?: number
    entryPrice?: number
    exitPrice?: number
}

interface ReportStats {
    totalPnl: number
    totalTrades: number
    winCount: number
    lossCount: number
    winRate: number
    profitFactor: number
    biggestWin: number
    biggestLoss: number
    riskRewardStr: string
    avgHoldFormatted: string
    avgRMultiple: number
    bestSymbols: { symbol: string; pnl: number; trades: number; winRate: number }[]
    worstSymbols: { symbol: string; pnl: number; trades: number; winRate: number }[]
    performanceTrend: { week: string; winRate: number; pf: number; rr: number }[]
    worst3: { symbol: string; type: string; date: string; pnl: number; hour: number }[]
    consistency: number
}

interface Blindspot {
    title: string
    severity: string
    description: string
    evidence: string
    recommendation: string
}

interface RecurringPattern {
    title: string
    pnl: number
    description: string
    tradeCount: number
    isPositive: boolean
}

interface WorstTradeAnalysis {
    whatWentWrong: string
    lesson: string
}

interface ActionPlanItem {
    title: string
    priority: string
    description: string
    measureSuccess: string
}

interface AIReport {
    title: string
    periodAssessment: string
    summary: string
    blindspots: Blindspot[]
    recurringPatterns: RecurringPattern[]
    worstTradeAnalysis: WorstTradeAnalysis[]
    actionPlan: ActionPlanItem[]
    stats: ReportStats
    generatedAt: string
}

interface SavedReport {
    id: string
    title: string
    periodAssessment: string
    totalPnl: number
    winRate: number
    totalTrades: number
    timeframe: string
    generatedAt: string
}

interface AITradingAnalyzerProps {
    trades: TradeData[]
    className?: string
}

const PERIODS = [
    { key: 'week', label: 'Weekly', desc: 'Last 7 days' },
    { key: 'month', label: 'Monthly', desc: 'Last 30 days' },
    { key: 'quarter', label: '3 Months', desc: 'Last 90 days' },
    { key: 'year', label: 'This Year', desc: 'Year to date' },
    { key: 'all', label: 'All Time', desc: 'Full history' },
] as const

// ═══════════════════════════════════════════════════
// LOADING STEPS
// ═══════════════════════════════════════════════════

const LOADING_STEPS = [
    { icon: BarChart3, title: 'Crunching your numbers', desc: 'Analyzing trade data', color: 'text-blue-400' },
    { icon: Eye, title: 'Finding your blindspots', desc: 'Detecting patterns', color: 'text-purple-400' },
    { icon: AlertCircle, title: 'Identifying mistakes', desc: 'Processing behaviors', color: 'text-amber-400' },
    { icon: Lightbulb, title: 'Building your action plan', desc: 'Creating insights', color: 'text-green-400' },
]

// ═══════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════

function AnimatedSection({ children, delay = 0, className = '' }: {
    children: React.ReactNode; delay?: number; className?: string
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    )
}

function useCountUp(target: number, duration = 1200, decimals = 0) {
    const [value, setValue] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const start = performance.now()
                    const animate = (now: number) => {
                        const elapsed = now - start
                        const progress = Math.min(elapsed / duration, 1)
                        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
                        setValue(parseFloat((eased * target).toFixed(decimals)))
                        if (progress < 1) requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [target, duration, decimals])

    return { value, ref }
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function AITradingAnalyzer({ trades, className }: AITradingAnalyzerProps) {
    const [view, setView] = useState<'landing' | 'loading' | 'report'>('landing')
    const [report, setReport] = useState<AIReport | null>(null)
    const [period, setPeriod] = useState<string>('all')
    const [showPeriodMenu, setShowPeriodMenu] = useState(false)
    const [loadingStep, setLoadingStep] = useState(0)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')
    const [savedReports, setSavedReports] = useState<SavedReport[]>([])
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const progressRef = useRef<NodeJS.Timeout | null>(null)

    // Load saved report summaries
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ai-reports')
            if (saved) setSavedReports(JSON.parse(saved))
        } catch { /* ignore */ }
    }, [])

    // Load a past report by ID
    const loadReport = useCallback((reportId: string) => {
        try {
            const stored = localStorage.getItem(`ai-report-${reportId}`)
            if (stored) {
                const fullReport: AIReport = JSON.parse(stored)
                setReport(fullReport)
                setView('report')
            } else {
                setError('Report data not found. Generate a new report.')
            }
        } catch {
            setError('Failed to load report.')
        }
    }, [])

    // Delete a saved report
    const deleteReport = useCallback((reportId: string) => {
        const updated = savedReports.filter(r => r.id !== reportId)
        setSavedReports(updated)
        localStorage.setItem('ai-reports', JSON.stringify(updated))
        localStorage.removeItem(`ai-report-${reportId}`)
        setDeleteConfirmId(null)
    }, [savedReports])

    const filterTradesByPeriod = useCallback((allTrades: TradeData[], tf: string) => {
        const now = new Date()
        let cutoff: Date
        switch (tf) {
            case 'week': cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
            case 'month': cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
            case 'quarter': cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break
            case 'year': cutoff = new Date(now.getFullYear(), 0, 1); break
            default: return allTrades
        }
        return allTrades.filter(t => new Date(t.entryDate) >= cutoff)
    }, [])

    const generateReport = useCallback(async () => {
        setView('loading')
        setLoadingStep(0)
        setProgress(0)
        setError('')

        const filteredTrades = filterTradesByPeriod(trades, period)
        if (filteredTrades.length === 0) {
            setError(`No closed trades found ${period === 'all' ? 'in your history' : 'in the selected period'}. Try selecting a different time frame.`)
            setView('landing')
            return
        }

        // Smooth progress animation — decelerates as it approaches 90%
        const startTime = Date.now()
        const maxProgress = 90 // never exceed 90% until API responds
        const expectedDuration = 25000 // ~25 seconds expected

        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime
            // Deceleration curve: fast at start, slows toward 90%
            const raw = (elapsed / expectedDuration) * 100
            const eased = maxProgress * (1 - Math.exp(-2.5 * (raw / 100)))
            const clamped = Math.min(Math.round(eased), maxProgress)

            setProgress(clamped)
            // Loading steps map to percentage thresholds
            if (clamped >= 75) setLoadingStep(3)
            else if (clamped >= 50) setLoadingStep(2)
            else if (clamped >= 25) setLoadingStep(1)
            else setLoadingStep(0)
        }, 150)

        try {
            const res = await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trades: filteredTrades, timeframe: period }),
            })

            if (progressRef.current) clearInterval(progressRef.current)

            // Animate from current to 100%
            setProgress(95)
            setLoadingStep(3)
            await new Promise(r => setTimeout(r, 300))
            setProgress(100)
            await new Promise(r => setTimeout(r, 400))

            if (!res.ok) throw new Error('Analysis failed')

            const data = await res.json()
            if (data.report) {
                setReport(data.report)
                setView('report')

                // Save to history
                const reportId = Date.now().toString()
                const saved: SavedReport = {
                    id: reportId,
                    title: data.report.title,
                    periodAssessment: data.report.periodAssessment,
                    totalPnl: data.report.stats.totalPnl,
                    winRate: data.report.stats.winRate,
                    totalTrades: data.report.stats.totalTrades,
                    timeframe: period,
                    generatedAt: data.report.generatedAt,
                }
                const updatedReports = [saved, ...savedReports].slice(0, 10)
                setSavedReports(updatedReports)
                localStorage.setItem('ai-reports', JSON.stringify(updatedReports))

                // Save the full report data for restoration
                localStorage.setItem(`ai-report-${reportId}`, JSON.stringify(data.report))
            }
        } catch (err: any) {
            if (progressRef.current) clearInterval(progressRef.current)
            setProgress(0)
            setError(err.message || 'Failed to generate report')
            setView('landing')
        }
    }, [trades, period, filterTradesByPeriod, savedReports])

    // ═══════════════════════════════════════════════
    // LANDING VIEW
    // ═══════════════════════════════════════════════

    if (view === 'landing') {
        return (
            <div className={`space-y-6 ${className || ''}`}>
                {/* Header Card */}
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-[var(--foreground)]">AI Analysis</h2>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Beta</span>
                                </div>
                                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                                    Decode your trading patterns, spot hidden mistakes, and get a personalized action plan.
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold
                                    hover:bg-blue-600 active:scale-[0.98] transition-all shadow-md shadow-blue-500/25"
                            >
                                <Zap className="w-4 h-4" /> Generate Report
                            </button>

                            {/* Period dropdown */}
                            {showPeriodMenu && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-3">Analysis Period</p>
                                            <div className="space-y-1">
                                                {PERIODS.map(p => (
                                                    <button
                                                        key={p.key}
                                                        onClick={() => setPeriod(p.key)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${period === p.key
                                                            ? 'text-blue-400 bg-blue-500/10 font-medium'
                                                            : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
                                                            }`}
                                                    >
                                                        <span>{p.label}</span>
                                                        <span className="text-xs text-[var(--foreground-muted)]">{p.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setShowPeriodMenu(false); generateReport(); }}
                                            className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold
                                                hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-4 h-4" /> Generate Report
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Past Reports */}
                {savedReports.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                            Past Reports <span className="text-[var(--foreground-muted)]">{savedReports.length}</span>
                        </h3>
                        <div className="space-y-2">
                            {savedReports.map(r => (
                                <div key={r.id} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-5 py-4 flex items-center justify-between hover:border-blue-500/30 transition-colors cursor-pointer group">
                                    <div onClick={() => loadReport(r.id)} className="flex-1">
                                        <p className="font-semibold text-sm text-[var(--foreground)]">{r.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--foreground-muted)]">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(r.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4" onClick={() => loadReport(r.id)}>
                                        <span className={`font-bold text-sm ${r.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {r.totalPnl >= 0 ? '+' : ''}{`$${Math.abs(r.totalPnl).toFixed(0)}`}
                                        </span>
                                        <span className="text-xs text-[var(--foreground-muted)]">
                                            {r.winRate.toFixed(0)}% win
                                        </span>
                                        <span className="text-xs text-[var(--foreground-muted)]">
                                            {r.totalTrades} trades
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.periodAssessment === 'PROFITABLE'
                                            ? 'bg-green-500/10 text-green-400'
                                            : r.periodAssessment === 'BREAK_EVEN'
                                                ? 'bg-amber-500/10 text-amber-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            ~ {r.periodAssessment === 'PROFITABLE' ? 'Profitable' : r.periodAssessment === 'BREAK_EVEN' ? 'Break Even' : 'Losing'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)]" />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id) }}
                                        className="ml-2 p-1.5 rounded-lg text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                        aria-label="Delete report"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setDeleteConfirmId(null)}>
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="font-bold text-[var(--foreground)] mb-1">Delete Report?</h3>
                            <p className="text-sm text-[var(--foreground-muted)] mb-5">This report will be permanently removed. This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteReport(deleteConfirmId)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════════
    // LOADING VIEW
    // ═══════════════════════════════════════════════

    if (view === 'loading') {
        // Determine step thresholds
        const stepThresholds = [0, 25, 50, 75]

        return (
            <div className={`flex flex-col items-center justify-center py-20 ${className || ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Analyzing Your Trading</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-8 text-center max-w-md">
                    Finding patterns in your trades and building personalized insights
                </p>

                <div className="w-full max-w-md space-y-3">
                    {LOADING_STEPS.map((step, i) => {
                        const Icon = step.icon
                        const stepStart = stepThresholds[i]
                        const stepEnd = i < 3 ? stepThresholds[i + 1] : 100
                        const isComplete = progress >= stepEnd
                        const isCurrent = progress >= stepStart && progress < stepEnd
                        const stepProgress = isCurrent
                            ? Math.round(((progress - stepStart) / (stepEnd - stepStart)) * 100)
                            : isComplete ? 100 : 0

                        return (
                            <div
                                key={i}
                                className={`relative flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-500 overflow-hidden ${isCurrent
                                    ? 'bg-blue-500/10 border border-blue-500/20'
                                    : isComplete
                                        ? 'bg-green-500/5 border border-transparent'
                                        : 'border border-transparent opacity-50'
                                    }`}
                            >
                                {/* Step sub-progress fill */}
                                {isCurrent && (
                                    <div
                                        className="absolute inset-0 bg-blue-500/5 transition-all duration-300 ease-out"
                                        style={{ width: `${stepProgress}%` }}
                                    />
                                )}
                                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center ${isCurrent
                                    ? 'bg-blue-500/20'
                                    : isComplete
                                        ? 'bg-green-500/20'
                                        : 'bg-[var(--background-secondary)]'
                                    }`}>
                                    {isComplete ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    ) : (
                                        <Icon className={`w-4 h-4 ${step.color} opacity-40`} />
                                    )}
                                </div>
                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-semibold ${isComplete ? 'text-green-400' : isCurrent ? 'text-blue-400' : 'text-[var(--foreground-muted)]'}`}>
                                            {step.title}
                                        </p>
                                        {isCurrent && (
                                            <span className="text-xs font-mono text-blue-400">{stepProgress}%</span>
                                        )}
                                        {isComplete && (
                                            <span className="text-xs font-mono text-green-400">Done</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--foreground-muted)]">{step.desc}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Overall progress bar */}
                <div className="w-full max-w-md mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--foreground-muted)]">Overall Progress</span>
                        <span className="text-xs font-mono font-semibold text-blue-400">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <p className="text-xs text-[var(--foreground-muted)] mt-4">This usually takes 20-40 seconds</p>
            </div>
        )
    }

    // ═══════════════════════════════════════════════
    // REPORT VIEW
    // ═══════════════════════════════════════════════

    if (!report) return null
    const s = report.stats

    const periodBadge = report.periodAssessment === 'PROFITABLE'
        ? { bg: 'bg-green-500/10', text: 'text-green-400', label: 'PROFITABLE PERIOD', icon: TrendingUp }
        : report.periodAssessment === 'BREAK_EVEN'
            ? { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'BREAK EVEN PERIOD', icon: Target }
            : { bg: 'bg-red-500/10', text: 'text-red-400', label: 'CHALLENGING PERIOD', icon: TrendingDown }

    return (
        <div className={`space-y-6 ${className || ''}`}>
            {/* Navigation */}
            <AnimatedSection delay={0}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setView('landing')}
                            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Reports
                        </button>
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-[var(--foreground)]">AI Analysis</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[9px] font-bold uppercase tracking-wider">Beta</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { setView('landing'); setTimeout(generateReport, 100) }}
                        className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Generate
                    </button>
                </div>
            </AnimatedSection>

            {/* ──────── SECTION 1: Header ──────── */}
            <AnimatedSection delay={100}>
                <div className={`rounded-2xl ${periodBadge.bg} border border-[var(--border)] p-6`}>
                    <div className="flex items-center gap-2 mb-3">
                        <periodBadge.icon className={`w-5 h-5 ${periodBadge.text}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${periodBadge.text}`}>
                            {periodBadge.label}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
                        {report.title}
                    </h1>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-3xl">
                        {report.summary}
                    </p>
                </div>
            </AnimatedSection>

            {/* ──────── SECTION 2: KPI Row ──────── */}
            <AnimatedSection delay={200}>
                <div className="grid grid-cols-4 gap-3">
                    <KPICard value={`$${s.totalPnl.toFixed(2)}`} label="TOTAL RETURN" color={s.totalPnl >= 0 ? 'green' : 'red'} highlight />
                    <KPICard value={s.totalTrades.toString()} label="TRADES" />
                    <KPICard value={`${s.winRate}%`} label="WIN RATE" color={s.winRate >= 50 ? 'green' : 'red'} progress={s.winRate} />
                    <KPICard value={s.profitFactor.toFixed(2)} label="PROFIT FACTOR" color={s.profitFactor >= 1 ? 'green' : 'red'} progress={Math.min(s.profitFactor / 3 * 100, 100)} />
                </div>
            </AnimatedSection>

            {/* ──────── SECTION 3 & 4: Win/Loss + Key Metrics ──────── */}
            <AnimatedSection delay={300}>
                <div className="grid grid-cols-2 gap-4">
                    {/* Win/Loss Distribution */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5" /> Win/Loss Distribution
                        </h3>
                        <div className="flex items-center gap-6">
                            <DonutChart wins={s.winCount} losses={s.lossCount} totalPnl={s.totalPnl} />
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                        <span className="text-xs text-[var(--foreground-muted)]">Winning</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-[var(--foreground)]">{s.winCount}</span>
                                        <span className="text-xs text-green-400">{s.totalTrades > 0 ? Math.round((s.winCount / s.totalTrades) * 100) : 0}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-400" />
                                        <span className="text-xs text-[var(--foreground-muted)]">Losing</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-[var(--foreground)]">{s.lossCount}</span>
                                        <span className="text-xs text-red-400">{s.totalTrades > 0 ? Math.round((s.lossCount / s.totalTrades) * 100) : 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics + Performance Trend */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 space-y-5">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Key Metrics
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <GaugeMetric value={s.winRate} label="Win Rate" suffix="%" max={100} />
                                <GaugeMetric value={s.profitFactor} label="Profit Factor" max={3} />
                                <GaugeMetric value={s.avgRMultiple} label="Risk Reward" display={s.riskRewardStr} max={3} />
                            </div>
                        </div>
                        {s.performanceTrend.length > 1 && (
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5" /> Performance Trend
                                </h3>
                                <MiniLineChart data={s.performanceTrend} />
                            </div>
                        )}
                    </div>
                </div>
            </AnimatedSection>

            {/* ──────── SECTION 5: Best & Worst Pairs ──────── */}
            <AnimatedSection delay={400}>
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                        <Award className="w-3.5 h-3.5" /> Your Best & Worst Pairs
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> MAKING MONEY
                            </p>
                            {s.bestSymbols.length > 0 ? s.bestSymbols.map((sym, i) => (
                                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-green-500/5 mb-2">
                                    <div>
                                        <span className="font-semibold text-sm text-[var(--foreground)]">{sym.symbol}</span>
                                        <span className="text-xs text-[var(--foreground-muted)] ml-2">{sym.trades} trades</span>
                                    </div>
                                    <span className="font-bold text-sm text-green-400">+${sym.pnl.toFixed(2)}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-[var(--foreground-muted)] py-4 text-center">No profitable pairs</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3" /> LOSING MONEY
                            </p>
                            {s.worstSymbols.length > 0 ? s.worstSymbols.map((sym, i) => (
                                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-red-500/5 mb-2">
                                    <div>
                                        <span className="font-semibold text-sm text-[var(--foreground)]">{sym.symbol}</span>
                                        <span className="text-xs text-[var(--foreground-muted)] ml-2">{sym.trades} trades</span>
                                    </div>
                                    <span className="font-bold text-sm text-red-400">${sym.pnl.toFixed(2)}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-[var(--foreground-muted)] py-4 text-center">No losing pairs</p>
                            )}
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* ──────── SECTION 6: The Numbers ──────── */}
            <AnimatedSection delay={500}>
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4">The Numbers</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <StatCard icon={<span className="text-blue-400 text-sm">$</span>} value={`$${s.totalPnl.toFixed(2)}`} label="Total P&L" color={s.totalPnl >= 0 ? 'green' : 'red'} />
                        <StatCard icon={<div className="w-2 h-2 rounded-full bg-blue-400" />} value={s.totalTrades.toString()} label="Trades" />
                        <StatCard icon={<TrendingUp className="w-3.5 h-3.5 text-green-400" />} value={`${s.winRate}%`} label="Win Rate" color={s.winRate >= 50 ? 'green' : 'red'} progress={s.winRate} />
                        <StatCard icon={<Shield className="w-3.5 h-3.5 text-amber-400" />} value={s.profitFactor.toFixed(2)} label="Profit Factor" color={s.profitFactor >= 1 ? 'green' : 'red'} progress={Math.min(s.profitFactor / 3 * 100, 100)} />
                        <StatCard icon={<ArrowUpRight className="w-3.5 h-3.5 text-green-400" />} value={`$${s.biggestWin.toFixed(2)}`} label="Biggest Win" color="green" />
                        <StatCard icon={<ArrowDownRight className="w-3.5 h-3.5 text-red-400" />} value={`$${s.biggestLoss.toFixed(2)}`} label="Biggest Loss" color="red" />
                        <StatCard icon={<Target className="w-3.5 h-3.5 text-amber-400" />} value={s.riskRewardStr} label="Risk/Reward" progress={Math.min(s.avgRMultiple / 2 * 100, 100)} />
                        <StatCard icon={<Clock className="w-3.5 h-3.5 text-blue-400" />} value={s.avgHoldFormatted} label="Avg Hold" />
                    </div>
                </div>
            </AnimatedSection>

            {/* ──────── SECTION 7: Your Blindspots ──────── */}
            {report.blindspots.length > 0 && (
                <AnimatedSection delay={600}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4">Your Blindspots</h3>
                    <div className="space-y-3">
                        {report.blindspots.map((b, i) => (
                            <BlindspotCard key={i} blindspot={b} />
                        ))}
                    </div>
                </AnimatedSection>
            )}

            {/* ──────── SECTION 8: Recurring Patterns ──────── */}
            {report.recurringPatterns.length > 0 && (
                <AnimatedSection delay={700}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4">Recurring Patterns</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {report.recurringPatterns.map((p, i) => (
                            <PatternCard key={i} pattern={p} />
                        ))}
                    </div>
                </AnimatedSection>
            )}

            {/* ──────── SECTION 9: Worst Trades ──────── */}
            {report.worstTradeAnalysis.length > 0 && s.worst3.length > 0 && (
                <AnimatedSection delay={800}>
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" /> Your Worst Trades
                        </h3>
                        <div className="space-y-4">
                            {s.worst3.map((t, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-xs font-bold mt-1">#{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-[var(--foreground)]">{t.symbol}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${t.type === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    » {t.type}
                                                </span>
                                                <span className="text-xs text-[var(--foreground-muted)]">{t.date}</span>
                                            </div>
                                            <span className="font-bold text-red-400">-${Math.abs(t.pnl).toFixed(2)}</span>
                                        </div>
                                        {report.worstTradeAnalysis[i] && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-red-500/5 rounded-lg px-3 py-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">What went wrong</p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">{report.worstTradeAnalysis[i].whatWentWrong}</p>
                                                </div>
                                                <div className="bg-blue-500/5 rounded-lg px-3 py-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Lesson</p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">{report.worstTradeAnalysis[i].lesson}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            )}

            {/* ──────── SECTION 10: Action Plan ──────── */}
            {report.actionPlan.length > 0 && (
                <AnimatedSection delay={900}>
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5" /> Your Action Plan
                        </h3>
                        <div className="space-y-4">
                            {report.actionPlan.map((a, i) => (
                                <ActionPlanCard key={i} action={a} index={i + 1} />
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            )}

            {/* ──────── Footer ──────── */}
            <AnimatedSection delay={1000}>
                <div className="text-center py-4">
                    <p className="text-xs text-[var(--foreground-muted)] flex items-center justify-center gap-2">
                        <Brain className="w-3 h-3" />
                        Generated {new Date(report.generatedAt).toLocaleDateString('en-US', {
                            month: 'numeric', day: 'numeric', year: 'numeric'
                        })}, {new Date(report.generatedAt).toLocaleTimeString('en-US', {
                            hour: 'numeric', minute: '2-digit', second: '2-digit'
                        })} from {s.totalTrades} trades
                    </p>
                </div>
            </AnimatedSection>
        </div>
    )
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

function KPICard({ value, label, color, highlight, progress }: {
    value: string; label: string; color?: string; highlight?: boolean; progress?: number
}) {
    return (
        <div className={`rounded-xl border p-4 ${highlight
            ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20'
            : 'bg-[var(--card-bg)] border-[var(--border)]'
            }`}>
            <p className={`text-xl font-bold ${color === 'green'
                ? 'text-green-400'
                : color === 'red'
                    ? 'text-red-400'
                    : 'text-[var(--foreground)]'
                }`}>
                {value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mt-1">{label}</p>
            {progress !== undefined && (
                <div className="w-full h-1 bg-[var(--background-secondary)] rounded-full mt-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${color === 'green' ? 'bg-green-400' : color === 'red' ? 'bg-red-400' : 'bg-blue-400'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function StatCard({ icon, value, label, color, progress }: {
    icon: React.ReactNode; value: string; label: string; color?: string; progress?: number
}) {
    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center mb-2">
                {icon}
            </div>
            <p className={`text-lg font-bold ${color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-[var(--foreground)]'}`}>
                {value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mt-0.5">{label}</p>
            {progress !== undefined && (
                <div className="w-full h-1 bg-[var(--background-secondary)] rounded-full mt-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${color === 'green' ? 'bg-green-400' : color === 'red' ? 'bg-red-400' : 'bg-blue-400'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function DonutChart({ wins, losses, totalPnl }: { wins: number; losses: number; totalPnl: number }) {
    const total = wins + losses
    const winPct = total > 0 ? (wins / total) * 100 : 50
    const circumference = 2 * Math.PI * 45
    const winArc = (winPct / 100) * circumference

    const ref = useRef<HTMLDivElement>(null)
    const [animPct, setAnimPct] = useState(0)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const start = performance.now()
                    const duration = 1200
                    const animate = (now: number) => {
                        const elapsed = now - start
                        const progress = Math.min(elapsed / duration, 1)
                        const eased = 1 - Math.pow(1 - progress, 3)
                        setAnimPct(eased)
                        if (progress < 1) requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)
                    observer.disconnect()
                }
            },
            { threshold: 0.2 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const animatedWinArc = winArc * animPct
    const animatedFullArc = circumference * animPct
    const animatedPnl = Math.round(Math.abs(totalPnl) * animPct)

    return (
        <div ref={ref} className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="10"
                    strokeDasharray={`${animatedFullArc} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="10"
                    strokeDasharray={`${animatedWinArc} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : '-'}{`$${animatedPnl}`}
                </span>
                <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Net PnL</span>
            </div>
        </div>
    )
}

function GaugeMetric({ value, label, suffix, max, display }: {
    value: number; label: string; suffix?: string; max: number; display?: string
}) {
    const pct = Math.min((value / max) * 100, 100)
    const totalArc = 141.37 // half-circle arc length

    const ref = useRef<HTMLDivElement>(null)
    const [animPct, setAnimPct] = useState(0)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const start = performance.now()
                    const duration = 1400
                    const animate = (now: number) => {
                        const elapsed = now - start
                        const progress = Math.min(elapsed / duration, 1)
                        // Springy ease-out for speedometer feel
                        const eased = progress < 1
                            ? 1 - Math.pow(1 - progress, 4)
                            : 1
                        setAnimPct(eased * pct)
                        if (progress < 1) requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)
                    observer.disconnect()
                }
            },
            { threshold: 0.2 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [pct])

    const animatedArc = (animPct / 100) * totalArc
    const currentColor = animPct > 60 ? '#22c55e' : animPct > 30 ? '#f59e0b' : '#ef4444'
    const textColor = animPct > 60 ? 'text-green-400' : animPct > 30 ? 'text-amber-400' : 'text-red-400'

    // Animated display value
    const animatedValue = display
        ? display
        : value < 10
            ? (animPct / 100 * value * max / max).toFixed(2)
            : Math.round(animPct / 100 * value).toString()
    const displayText = display || `${animatedValue}${suffix || ''}`

    return (
        <div ref={ref} className="text-center">
            <div className="relative w-16 h-8 mx-auto mb-1 overflow-hidden">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
                    <path
                        d="M 5 50 A 45 45 0 0 1 95 50" fill="none"
                        stroke={currentColor}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${animatedArc} ${totalArc}`}
                    />
                    {/* Needle indicator */}
                    <circle
                        cx={50 + 45 * Math.cos(Math.PI - (animPct / 100) * Math.PI)}
                        cy={50 - 45 * Math.sin(Math.PI - (animPct / 100) * Math.PI)}
                        r="3" fill={currentColor}
                        style={{ filter: `drop-shadow(0 0 3px ${currentColor})`, transition: 'fill 0.3s' }}
                    />
                </svg>
            </div>
            <p className={`text-sm font-bold ${textColor}`}>{displayText}</p>
            <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">{label}</p>
        </div>
    )
}

function MiniLineChart({ data }: { data: { week: string; winRate: number; pf: number; rr: number }[] }) {
    const ref = useRef<HTMLDivElement>(null)
    const [animPct, setAnimPct] = useState(0)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const start = performance.now()
                    const duration = 1000
                    const animate = (now: number) => {
                        const elapsed = now - start
                        const progress = Math.min(elapsed / duration, 1)
                        const eased = 1 - Math.pow(1 - progress, 3)
                        setAnimPct(eased)
                        if (progress < 1) requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)
                    observer.disconnect()
                }
            },
            { threshold: 0.15 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    if (data.length < 2) return null

    // Chart dimensions
    const h = 100
    const w = 340
    const padL = 30 // left padding for Y-axis labels
    const padR = 10
    const padT = 5
    const padB = 20 // bottom padding for X-axis labels
    const chartW = w - padL - padR
    const chartH = h - padT - padB

    // Normalize all 3 metrics to 0-100 scale
    // winRate is already 0-100
    // pf: clamp 0-3 → 0-100
    // rr: clamp 0-3 → 0-100
    const normalize = (arr: number[], maxVal: number) =>
        arr.map(v => Math.min((v / maxVal) * 100, 100))

    const winRates = data.map(d => d.winRate)
    const pfValues = normalize(data.map(d => d.pf), 3)
    const rrValues = normalize(data.map(d => d.rr), 3)

    const stepX = chartW / (data.length - 1)

    // Generate polyline points for a series
    const toPoints = (values: number[]) =>
        values.map((v, i) => `${padL + i * stepX},${padT + chartH - (v / 100) * chartH}`).join(' ')

    // Animated clipping — reveal lines left to right
    const clipWidth = padL + chartW * animPct

    // Grid lines at 0%, 25%, 50%, 75%, 100%
    const gridLines = [0, 25, 50, 75, 100]

    // Format date label from ISO string "2026-01-20" → "Jan 20"
    const formatDate = (iso: string) => {
        const d = new Date(iso + 'T00:00:00')
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Pick ~4 evenly spaced X labels
    const labelCount = Math.min(data.length, 4)
    const labelIndices: number[] = []
    for (let i = 0; i < labelCount; i++) {
        labelIndices.push(Math.round(i * (data.length - 1) / (labelCount - 1)))
    }

    const lines = [
        { name: 'Win Rate', color: '#22c55e', points: toPoints(winRates) },
        { name: 'Profit Factor', color: '#3b82f6', points: toPoints(pfValues) },
        { name: 'Risk/Reward', color: '#f59e0b', points: toPoints(rrValues) },
    ]

    return (
        <div ref={ref} className="w-full">
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 mb-2">
                {lines.map(l => (
                    <div key={l.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-[9px] text-[var(--foreground-muted)]">{l.name}</span>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '120px' }}>
                <defs>
                    <clipPath id="chart-reveal">
                        <rect x="0" y="0" width={clipWidth} height={h} />
                    </clipPath>
                </defs>

                {/* Grid lines + Y labels */}
                {gridLines.map(pct => {
                    const y = padT + chartH - (pct / 100) * chartH
                    return (
                        <g key={pct}>
                            <line x1={padL} y1={y} x2={w - padR} y2={y}
                                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
                            <text x={padL - 4} y={y + 3} textAnchor="end"
                                fontSize="7" fill="var(--foreground-muted)">{pct}%</text>
                        </g>
                    )
                })}

                {/* X-axis labels */}
                {labelIndices.map(idx => (
                    <text key={idx} x={padL + idx * stepX} y={h - 2} textAnchor="middle"
                        fontSize="7" fill="var(--foreground-muted)">
                        {formatDate(data[idx].week)}
                    </text>
                ))}

                {/* Lines with clip animation */}
                <g clipPath="url(#chart-reveal)">
                    {lines.map(l => (
                        <polyline key={l.name} points={l.points} fill="none"
                            stroke={l.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    ))}

                    {/* Data points (dots) */}
                    {animPct >= 0.9 && lines.map(l => {
                        const values = l.name === 'Win Rate' ? winRates : l.name === 'Profit Factor' ? pfValues : rrValues
                        return values.map((v, i) => (
                            <circle key={`${l.name}-${i}`} cx={padL + i * stepX}
                                cy={padT + chartH - (v / 100) * chartH}
                                r="2.5" fill={l.color} opacity={0.8} />
                        ))
                    })}
                </g>
            </svg>
        </div>
    )
}

function BlindspotCard({ blindspot: b }: { blindspot: Blindspot }) {
    const isWarning = b.severity === 'WARNING'
    return (
        <div className={`rounded-xl border p-5 ${isWarning
            ? 'bg-amber-500/5 border-amber-500/15'
            : 'bg-blue-500/5 border-blue-500/15'
            }`}>
            <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isWarning ? 'text-amber-400' : 'text-blue-400'}`}>
                    <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm text-[var(--foreground)]">{b.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isWarning
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {b.severity}
                        </span>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-3">{b.description}</p>
                    <div className="bg-[var(--background-secondary)] rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-[var(--foreground-muted)] italic">Evidence: {b.evidence}</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--foreground)] leading-relaxed">{b.recommendation}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PatternCard({ pattern: p }: { pattern: RecurringPattern }) {
    return (
        <div className={`rounded-xl border p-4 ${p.isPositive
            ? 'bg-green-500/5 border-green-500/15'
            : 'bg-red-500/5 border-red-500/15'
            }`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {p.isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="font-bold text-sm text-[var(--foreground)]">{p.title}</span>
                </div>
                <span className={`font-bold text-sm ${p.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                </span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mb-2">{p.description}</p>
            <p className="text-xs text-[var(--foreground-muted)]">{p.tradeCount} trades</p>
        </div>
    )
}

function ActionPlanCard({ action: a, index }: { action: ActionPlanItem; index: number }) {
    const priorityColor = a.priority.toLowerCase().includes('first')
        ? 'text-red-400'
        : a.priority.toLowerCase().includes('important')
            ? 'text-amber-400'
            : 'text-green-400'

    const priorityBg = a.priority.toLowerCase().includes('first')
        ? 'bg-red-500/10'
        : a.priority.toLowerCase().includes('important')
            ? 'bg-amber-500/10'
            : 'bg-green-500/10'

    return (
        <div className="flex items-start gap-4 py-3 border-b border-[var(--border)] last:border-0">
            <span className="text-lg font-bold text-blue-400 mt-0.5 w-6 text-center">{index}</span>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-[var(--foreground)]">{a.title}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${priorityColor} ${priorityBg} px-2 py-0.5 rounded-full`}>
                        • {a.priority}
                    </span>
                </div>
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-2">{a.description}</p>
                <div className="flex items-start gap-1.5">
                    <Target className="w-3 h-3 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--foreground-muted)] italic">Measure success: {a.measureSuccess}</p>
                </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] flex-shrink-0 mt-1" />
        </div>
    )
}
