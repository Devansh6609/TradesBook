'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, TrendingUp, TrendingDown, Send, Activity, User, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function LoungeFeed() {
    const queryClient = useQueryClient()
    const [content, setContent] = useState('')

    const { data: realPosts, isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            const res = await fetch('/api/community/posts')
            if (!res.ok) throw new Error('Failed to fetch posts')
            return res.json()
        }
    })

    const dummyPosts = [
        {
            id: 'd1',
            content: 'Just closed a massive swing on XAUUSD. The institutional order block at 2015 perfectly held. Watch for the retest of 2030, volume profile shows thin liquidity above.',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            user: { name: 'Alen Silva', image: null, reputation: 540 },
            trade: { symbol: 'XAUUSD', type: 'BUY', netPnl: 1250.50 },
            reactions: { bullish: 24, bearish: 2, userReaction: 'BULLISH' }
        },
        {
            id: 'd2',
            content: 'EURUSD looking weak below 1.0850. ECB minutes signal prolonged hold, but markets are pricing in cuts. Im heavy short here targeting 1.0780.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            user: { name: 'ProTrader99', image: null, reputation: 320 },
            trade: { symbol: 'EURUSD', type: 'SELL', netPnl: 450.20 },
            reactions: { bullish: 5, bearish: 45, userReaction: null }
        },
        {
            id: 'd3',
            content: 'Anyone else noticing the structural shift in JPY pairs? BOJ intervention rhetoric is getting louder. Adjusting my risk parameters accordingly.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            user: { name: 'MacroSniper', image: null, reputation: 890 },
            trade: null,
            reactions: { bullish: 15, bearish: 0, userReaction: null }
        }
    ];

    const posts = realPosts?.length > 0 ? realPosts : dummyPosts;

    const createPost = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            })
            if (!res.ok) throw new Error('Failed to create post')
            return res.json()
        },
        onSuccess: () => {
            setContent('')
            queryClient.invalidateQueries({ queryKey: ['posts'] })
        }
    })

    const reactMutation = useMutation({
        mutationFn: async ({ postId, type }: { postId: string, type: 'BULLISH' | 'BEARISH' }) => {
            const res = await fetch(`/api/community/posts/${postId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            })
            if (!res.ok) throw new Error('Failed to react')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] })
        }
    })

    const handlePost = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        createPost.mutate(content)
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Create Post Widget */}
            <div className="glass-obsidian rounded-3xl p-6 border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Terminal Broadcast</h3>
                </div>
                <form onSubmit={handlePost}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share market insights, institutional flow, or trade setups..."
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 resize-none h-24 transition-all hover:bg-slate-200 dark:hover:bg-black/60 placeholder:text-slate-400 dark:placeholder:text-white/20"
                    />
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                            <button type="button" className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-xs font-bold text-slate-600 dark:text-[var(--foreground-muted)] border border-slate-300 dark:border-white/5 transition-colors flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> Attach Trade
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={!content.trim() || createPost.isPending}
                            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md dark:shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2"
                        >
                            {createPost.isPending ? 'TRANSMITTING...' : 'BROADCAST'}
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Feed Stream */}
            <div className="flex-1 overflow-auto space-y-4 pr-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-sm font-medium text-slate-500 dark:text-[var(--foreground-muted)] animate-pulse">Decrypting Terminal Stream...</p>
                    </div>
                ) : (
                    posts?.map((post: any) => (
                        <div key={post.id} className="glass-obsidian rounded-3xl p-6 border-black/5 dark:border-white/5 transition-all hover:border-black/10 dark:hover:border-white/10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-white/10 overflow-hidden">
                                        {post.user.image ? (
                                            <img src={post.user.image} alt={post.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-slate-500 dark:text-white/50" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                            {post.user.name}
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                                                REP {post.user.reputation}
                                            </span>
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-[var(--foreground-muted)] flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <p className="text-sm text-slate-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap mb-4 font-medium">
                                {post.content}
                            </p>

                            {/* Trade Attachment */}
                            {post.trade && (
                                <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                                            post.trade.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                        )}>
                                            {post.trade.type === 'BUY' ? 'L' : 'S'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white text-sm tracking-wide">{post.trade.symbol}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-[var(--foreground-muted)] font-bold uppercase tracking-widest">Trade Attachment</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "font-mono font-bold text-sm",
                                            post.trade.netPnl > 0 ? "text-emerald-600 dark:text-emerald-400" : post.trade.netPnl < 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"
                                        )}>
                                            {post.trade.netPnl > 0 ? '+' : ''}{post.trade.netPnl?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Reactions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                                <button
                                    onClick={() => reactMutation.mutate({ postId: post.id, type: 'BULLISH' })}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        post.reactions.userReaction === 'BULLISH'
                                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)] dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[var(--foreground-muted)] border-slate-200 dark:border-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/20"
                                    )}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    BULLISH {post.reactions.bullish > 0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-black/50 rounded-md">{post.reactions.bullish}</span>}
                                </button>

                                <button
                                    onClick={() => reactMutation.mutate({ postId: post.id, type: 'BEARISH' })}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        post.reactions.userReaction === 'BEARISH'
                                            ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] dark:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[var(--foreground-muted)] border-slate-200 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/20"
                                    )}
                                >
                                    <TrendingDown className="w-4 h-4" />
                                    BEARISH {post.reactions.bearish > 0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-black/50 rounded-md">{post.reactions.bearish}</span>}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
