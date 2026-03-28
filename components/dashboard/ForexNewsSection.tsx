'use client'

import { useEffect, useState, useCallback } from 'react'
import { Newspaper, ExternalLink, RefreshCw, Clock, TrendingUp, Gem } from 'lucide-react'
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

type FilterCategory = 'all' | 'forex' | 'commodities'

function getRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function NewsCardSkeleton() {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--background-tertiary)]" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--background-tertiary)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--background-tertiary)] rounded w-full" />
                    <div className="h-3 bg-[var(--background-tertiary)] rounded w-1/2" />
                </div>
            </div>
        </div>
    )
}

interface NewsCardProps {
    item: NewsItem
    index: number
}

function NewsCard({ item, index }: NewsCardProps) {
    const categoryStyles = {
        forex: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            icon: <TrendingUp className="w-4 h-4" />
        },
        commodities: {
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            border: 'border-amber-500/20',
            icon: <Gem className="w-4 h-4" />
        },
        general: {
            bg: 'bg-gray-500/10',
            text: 'text-gray-400',
            border: 'border-gray-500/20',
            icon: <Newspaper className="w-4 h-4" />
        }
    }

    const style = categoryStyles[item.category]

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "block bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-500/30",
                "group animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-start gap-3">
                {/* Category Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    "transition-transform duration-300 group-hover:scale-110",
                    style.bg, style.text
                )}>
                    {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            style.bg, style.text, style.border, "border"
                        )}>
                            {item.category}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(item.timestamp)}
                        </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {item.title}
                    </h4>

                    {/* Summary */}
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mb-2">
                        {item.summary}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                            {item.source}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        </a>
    )
}

export function ForexNewsSection() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterCategory>('all')
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchNews = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true)

        try {
            const res = await fetch('/api/news', { cache: 'no-store' })
            const data = await res.json()
            setNews(data.news || [])
            setLastUpdated(new Date().toLocaleTimeString())
        } catch (error) {
            console.error('Failed to fetch news:', error)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchNews()

        // Auto-refresh every 60 seconds
        const interval = setInterval(() => fetchNews(true), 60000)
        return () => clearInterval(interval)
    }, [fetchNews])

    const filteredNews = news.filter(item =>
        filter === 'all' || item.category === filter
    )

    const filterButtons: { value: FilterCategory; label: string }[] = [
        { value: 'all', label: 'All News' },
        { value: 'forex', label: 'Forex' },
        { value: 'commodities', label: 'Commodities' }
    ]

    return (
        <div className="mt-12 animate-fade-up" style={{ animationDelay: '400ms' }}>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                        <Newspaper className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Market News</h2>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Live forex & commodities updates
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Filter Buttons */}
                    <div className="flex bg-[var(--background-secondary)] rounded-lg p-1">
                        {filterButtons.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                    filter === value
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchNews(true)}
                        disabled={isRefreshing}
                        className={cn(
                            "p-2 rounded-lg bg-[var(--background-secondary)] text-[var(--foreground-muted)]",
                            "hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200",
                            "disabled:opacity-50"
                        )}
                        title="Refresh news"
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
                <p className="text-[10px] text-[var(--foreground-muted)] mb-4">
                    Last updated: {lastUpdated} • Auto-refreshes every minute
                </p>
            )}

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <NewsCardSkeleton key={i} />
                    ))
                ) : filteredNews.length > 0 ? (
                    filteredNews.map((item, i) => (
                        <NewsCard key={item.id} item={item} index={i} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-[var(--foreground-muted)]">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No news available for this category</p>
                    </div>
                )}
            </div>

            {/* Inline animation styles */}
            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    )
}
