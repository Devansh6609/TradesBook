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

function getRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

const categoryConfig = {
    forex: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    commodities: { icon: Gem, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    general: { icon: Newspaper, color: 'text-gray-400', bg: 'bg-gray-500/10' }
}

function NewsListItem({ item }: { item: NewsItem }) {
    const config = categoryConfig[item.category]
    const Icon = config.icon

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 py-3 px-4 border-b border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors"
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
                <h4 className="text-sm font-medium text-[var(--foreground)] group-hover:text-blue-400 transition-colors line-clamp-1">
                    {item.title}
                </h4>
                <p className="text-xs text-[var(--foreground-muted)] line-clamp-1 mt-0.5 group-hover:line-clamp-2 transition-all">
                    {item.summary}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--foreground-muted)]">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(item.timestamp)}
                    </span>
                </div>
            </div>

            {/* External Link */}
            <ExternalLink className="w-4 h-4 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        </a>
    )
}

export function CompactNewsList() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchNews = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true)

        try {
            const res = await fetch('/api/news', { cache: 'no-store' })
            const data = await res.json()
            setNews(data.news || [])
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

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Market News</h3>
                        <p className="text-xs text-[var(--foreground-muted)]">Latest forex & commodities updates</p>
                    </div>
                </div>

                <button
                    onClick={() => fetchNews(true)}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </button>
            </div>

            {/* News List */}
            <div className="max-h-[600px] overflow-y-auto">
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
                ) : news.length > 0 ? (
                    news.map(item => (
                        <NewsListItem key={item.id} item={item} />
                    ))
                ) : (
                    <div className="py-12 text-center text-[var(--foreground-muted)]">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No news available</p>
                    </div>
                )}
            </div>
        </div>
    )
}
