'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    Newspaper, ExternalLink, RefreshCw, Clock, TrendingUp, Gem,
    Search, ChevronDown, ChevronUp, Zap, Building2, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsItem {
    id: string
    title: string
    summary: string
    source: string
    url: string
    imageUrl: string | null
    category: 'forex' | 'commodities' | 'general'
    publishedAt: string
    timestamp: number
}

// Enhanced news item with additional fields
interface EnhancedNewsItem extends NewsItem {
    affectedPairs: string[]
    isBreaking: boolean
}

type CategoryFilter = 'all' | 'forex' | 'commodities' | 'central-banks'

function getRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

// Detect affected currency pairs from news title/summary
function detectAffectedPairs(title: string, summary: string): string[] {
    const text = `${title} ${summary}`.toUpperCase()
    const pairs: string[] = []

    const currencyPairs = [
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
        'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/AUD', 'EUR/CHF', 'EUR/CAD'
    ]

    const currencyKeywords: Record<string, string[]> = {
        'EUR': ['EURO', 'ECB', 'EUROPEAN', 'EUROZONE', 'GERMANY', 'GERMAN', 'FRANCE', 'FRENCH'],
        'USD': ['DOLLAR', 'FED', 'FEDERAL RESERVE', 'US ', 'U.S.', 'AMERICA', 'POWELL'],
        'GBP': ['POUND', 'STERLING', 'BOE', 'BANK OF ENGLAND', 'BRITAIN', 'BRITISH', 'UK '],
        'JPY': ['YEN', 'BOJ', 'BANK OF JAPAN', 'JAPAN', 'JAPANESE'],
        'AUD': ['AUSSIE', 'RBA', 'AUSTRALIA', 'AUSTRALIAN'],
        'CAD': ['LOONIE', 'BOC', 'CANADA', 'CANADIAN'],
        'CHF': ['FRANC', 'SNB', 'SWISS', 'SWITZERLAND'],
        'NZD': ['KIWI', 'RBNZ', 'NEW ZEALAND']
    }

    // Check for direct pair mentions
    for (const pair of currencyPairs) {
        if (text.includes(pair.replace('/', ''))) {
            pairs.push(pair)
        }
    }

    // Check for currency keywords
    const detectedCurrencies: string[] = []
    for (const [currency, keywords] of Object.entries(currencyKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                if (!detectedCurrencies.includes(currency)) {
                    detectedCurrencies.push(currency)
                }
                break
            }
        }
    }

    // Generate pair combinations from detected currencies
    if (detectedCurrencies.length >= 1 && pairs.length === 0) {
        for (const currency of detectedCurrencies) {
            if (currency !== 'USD') {
                pairs.push(`${currency}/USD`)
            } else if (detectedCurrencies.length === 1) {
                pairs.push('EUR/USD', 'GBP/USD')
            }
        }
    }

    return [...new Set(pairs)].slice(0, 3) // Max 3 pairs
}

// Check if news is breaking (less than 30 min old and high impact keywords)
function isBreakingNews(item: NewsItem): boolean {
    const now = Math.floor(Date.now() / 1000)
    const isRecent = (now - item.timestamp) < 1800 // 30 minutes

    const breakingKeywords = ['BREAKING', 'JUST IN', 'URGENT', 'ALERT', 'FLASH']
    const hasBreakingKeyword = breakingKeywords.some(kw =>
        item.title.toUpperCase().includes(kw)
    )

    const highImpactKeywords = ['RATE DECISION', 'NFP', 'NON-FARM', 'CPI', 'GDP', 'INFLATION']
    const isHighImpact = highImpactKeywords.some(kw =>
        item.title.toUpperCase().includes(kw)
    )

    return isRecent && (hasBreakingKeyword || isHighImpact)
}

// Check if news is about central banks
function isCentralBankNews(title: string, summary: string): boolean {
    const text = `${title} ${summary}`.toUpperCase()
    const cbKeywords = ['FED', 'ECB', 'BOE', 'BOJ', 'RBA', 'BOC', 'SNB', 'RBNZ',
        'CENTRAL BANK', 'RATE DECISION', 'MONETARY POLICY', 'INTEREST RATE']
    return cbKeywords.some(kw => text.includes(kw))
}

const categoryConfig = {
    forex: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    commodities: { icon: Gem, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    general: { icon: Newspaper, color: 'text-gray-400', bg: 'bg-gray-500/10' }
}

// Breaking News Card Component
function BreakingNewsCard({ item }: { item: EnhancedNewsItem }) {
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl hover:border-red-500/50 transition-all group"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 animate-pulse">
                    <Zap className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white rounded animate-pulse">
                            Breaking
                        </span>
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                            {getRelativeTime(item.timestamp)}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-red-400 transition-colors line-clamp-2">
                        {item.title}
                    </h3>
                    {item.affectedPairs.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            {item.affectedPairs.map(pair => (
                                <span key={pair} className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--background-tertiary)] text-[var(--foreground-muted)] rounded">
                                    {pair}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
        </a>
    )
}

// Expandable News Card Component
function ExpandableNewsCard({ item }: { item: EnhancedNewsItem }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const config = categoryConfig[item.category]
    const Icon = config.icon

    return (
        <div className="border-b border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors">
            <div
                className="flex items-start gap-3 py-3 px-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Icon */}
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    config.bg
                )}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={cn(
                        "text-sm font-medium text-[var(--foreground)] transition-colors",
                        isExpanded ? "line-clamp-none" : "line-clamp-1"
                    )}>
                        {item.title}
                    </h4>

                    {/* Affected Pairs */}
                    {item.affectedPairs.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            {item.affectedPairs.map(pair => (
                                <span key={pair} className="px-1.5 py-0.5 text-[9px] font-medium bg-blue-500/10 text-blue-400 rounded">
                                    {pair}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--foreground-muted)]">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(item.timestamp)}
                        </span>
                    </div>
                </div>

                {/* Expand/Collapse + External Link */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        className="p-1 rounded hover:bg-[var(--background-tertiary)] transition-colors"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--foreground-muted)]" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                        )}
                    </button>
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-blue-500/10 transition-colors"
                        title="Open article"
                    >
                        <ExternalLink className="w-4 h-4 text-[var(--foreground-muted)] hover:text-blue-400" />
                    </a>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 pl-[60px]">
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                        {item.summary}
                    </p>
                </div>
            )}
        </div>
    )
}

export function EnhancedNewsList() {
    const [news, setNews] = useState<EnhancedNewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [category, setCategory] = useState<CategoryFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchNews = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true)

        try {
            const res = await fetch('/api/news', { cache: 'no-store' })
            const data = await res.json()

            // Enhance news items with detected pairs and breaking status
            const enhancedNews: EnhancedNewsItem[] = (data.news || []).map((item: NewsItem) => ({
                ...item,
                affectedPairs: detectAffectedPairs(item.title, item.summary),
                isBreaking: isBreakingNews(item)
            }))

            setNews(enhancedNews)
        } catch (error) {
            console.error('Failed to fetch news:', error)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchNews()
        const interval = setInterval(() => fetchNews(true), 60000)
        return () => clearInterval(interval)
    }, [fetchNews])

    // Filter news
    const filteredNews = news.filter(item => {
        // Category filter
        if (category === 'forex' && item.category !== 'forex') return false
        if (category === 'commodities' && item.category !== 'commodities') return false
        if (category === 'central-banks' && !isCentralBankNews(item.title, item.summary)) return false

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchesTitle = item.title.toLowerCase().includes(query)
            const matchesSummary = item.summary.toLowerCase().includes(query)
            const matchesPairs = item.affectedPairs.some(p => p.toLowerCase().includes(query))
            if (!matchesTitle && !matchesSummary && !matchesPairs) return false
        }

        return true
    })

    // Separate breaking news
    const breakingNews = filteredNews.filter(item => item.isBreaking)
    const regularNews = filteredNews.filter(item => !item.isBreaking)

    const categories: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
        { id: 'all', label: 'All', icon: <Newspaper className="w-3.5 h-3.5" /> },
        { id: 'forex', label: 'Forex', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        { id: 'commodities', label: 'Commodities', icon: <Gem className="w-3.5 h-3.5" /> },
        { id: 'central-banks', label: 'Central Banks', icon: <Building2 className="w-3.5 h-3.5" /> },
    ]

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)]">Market News</h3>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                {filteredNews.length} articles • Auto-refreshes every minute
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchNews(true)}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                        title="Refresh news"
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                        type="text"
                        placeholder="Search news, pairs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                                category === cat.id
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
                            )}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Breaking News Section */}
            {breakingNews.length > 0 && (
                <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]/50 space-y-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Breaking News</span>
                    </div>
                    {breakingNews.map(item => (
                        <BreakingNewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}

            {/* News List */}
            <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 border-b border-[var(--border)] animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-[var(--background-tertiary)]" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-[var(--background-tertiary)] rounded w-3/4" />
                                <div className="h-3 bg-[var(--background-tertiary)] rounded w-full" />
                            </div>
                        </div>
                    ))
                ) : regularNews.length > 0 ? (
                    regularNews.map(item => (
                        <ExpandableNewsCard key={item.id} item={item} />
                    ))
                ) : (
                    <div className="py-12 text-center text-[var(--foreground-muted)]">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No news found</p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-2 text-xs text-blue-400 hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
