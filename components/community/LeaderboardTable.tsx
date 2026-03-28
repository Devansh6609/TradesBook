'use client'

import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, Star, Target, TrendingUp, TrendingDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LeaderboardTable() {
    const { data: realLeaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const res = await fetch('/api/community/leaderboard')
            if (!res.ok) throw new Error('Failed to fetch leaderboard')
            return res.json()
        }
    })

    const dummyData = [
        { id: '1', name: 'Alen Silva', totalPnL: 14500.50, winRate: 78.5, totalTrades: 124, reputation: 540, rank: 1 },
        { id: '2', name: 'ProTrader99', totalPnL: 8200.00, winRate: 65.2, totalTrades: 89, reputation: 320, rank: 2 },
        { id: '3', name: 'FX_Sniper', totalPnL: 6100.25, winRate: 61.1, totalTrades: 210, reputation: 210, rank: 3 },
        { id: '4', name: 'MarketMakerX', totalPnL: 4500.00, winRate: 58.9, totalTrades: 45, reputation: 110, rank: 4 },
        { id: '5', name: 'PipsHunter', totalPnL: 3200.75, winRate: 54.3, totalTrades: 167, reputation: 90, rank: 5 },
    ];

    const leaderboard = realLeaderboard?.length > 0 ? realLeaderboard : dummyData;

    // Format currency
    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
    }

    if (isLoading) {
        return (
            <div className="glass-obsidian rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-[var(--foreground-muted)] animate-pulse">Ranking Elite Traders...</p>
            </div>
        )
    }

    return (
        <div className="glass-obsidian rounded-3xl overflow-hidden border-black/5 dark:border-white/5 flex flex-col h-full">
            <div className="p-6 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Leaderboard</h2>
                        <p className="text-xs text-slate-500 dark:text-[var(--foreground-muted)] font-medium">Top performing nodes by Net P&L</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-black/5 dark:border-white/5 bg-slate-100 dark:bg-black/40 text-xs uppercase tracking-widest text-slate-500 dark:text-[var(--foreground-muted)]">
                            <th className="px-6 py-4 font-bold w-16 text-center">Rank</th>
                            <th className="px-6 py-4 font-bold">Trader</th>
                            <th className="px-6 py-4 font-bold text-right">Net P&L</th>
                            <th className="px-6 py-4 font-bold text-center">Win %</th>
                            <th className="px-6 py-4 font-bold text-center">Trades</th>
                            <th className="px-6 py-4 font-bold text-center">Rep</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/[0.02]">
                        {leaderboard?.map((trader: any, index: number) => {
                            const rank = trader.rank;
                            const isTop3 = rank <= 3;

                            let rowStyle = "hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group";
                            let rankStyle = "text-slate-500 dark:text-[var(--foreground-muted)]";
                            let avatarGlow = "border-black/5 dark:border-white/10 text-slate-500 dark:text-white/50";

                            if (rank === 1) {
                                rowStyle = "bg-amber-50 dark:bg-amber-500/[0.03] hover:bg-amber-100 dark:hover:bg-amber-500/[0.06] border-l-2 border-l-amber-500 transition-colors group";
                                rankStyle = "text-amber-500 font-black dark:shadow-amber-500/50 dark:drop-shadow-md";
                                avatarGlow = "shadow-[0_0_15px_rgba(245,158,11,0.1)] dark:shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-300 dark:border-amber-500/50";
                            } else if (rank === 2) {
                                rowStyle = "bg-slate-100 dark:bg-slate-300/[0.03] hover:bg-slate-200 dark:hover:bg-slate-300/[0.06] border-l-2 border-l-slate-400 dark:border-l-slate-300 transition-colors group";
                                rankStyle = "text-slate-500 dark:text-slate-300 font-black dark:shadow-slate-300/50 dark:drop-shadow-md";
                                avatarGlow = "shadow-[0_0_15px_rgba(148,163,184,0.1)] dark:shadow-[0_0_15px_rgba(203,213,225,0.3)] border-slate-300 dark:border-slate-400/50";
                            } else if (rank === 3) {
                                rowStyle = "bg-orange-50 dark:bg-orange-700/[0.03] hover:bg-orange-100 dark:hover:bg-orange-700/[0.06] border-l-2 border-l-orange-500 transition-colors group";
                                rankStyle = "text-orange-500 font-black dark:shadow-orange-500/50 dark:drop-shadow-md";
                                avatarGlow = "shadow-[0_0_15px_rgba(249,115,22,0.1)] dark:shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-300 dark:border-orange-500/50";
                            }

                            return (
                                <tr key={trader.id} className={rowStyle}>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={cn("text-lg", rankStyle)}>
                                            {rank === 1 ? <Trophy className="w-5 h-5 mx-auto" /> :
                                                rank === 2 ? <Medal className="w-5 h-5 mx-auto" /> :
                                                    rank === 3 ? <Medal className="w-5 h-5 mx-auto" /> :
                                                        `#${rank}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border overflow-hidden", avatarGlow)}>
                                            {trader.image ? (
                                                <img src={trader.image} alt={trader.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{trader.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={cn(
                                            "font-mono font-bold text-sm px-2 py-1 rounded-md",
                                            trader.totalPnL > 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10" :
                                                trader.totalPnL < 0 ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10" :
                                                    "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10"
                                        )}>
                                            {trader.totalPnL > 0 ? '+' : ''}{formatMoney(trader.totalPnL)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={cn(
                                                "font-mono font-bold text-sm",
                                                trader.winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                            )}>
                                                {trader.winRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono text-slate-500 dark:text-[var(--foreground-muted)]">
                                        {trader.totalTrades}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                            <Star className="w-3.5 h-3.5" />
                                            <span className="font-bold font-mono text-xs">{trader.reputation}</span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {!leaderboard?.length && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-[var(--foreground-muted)]">
                                    <div className="flex flex-col items-center gap-4">
                                        <Target className="w-8 h-8 opacity-20" />
                                        <p>No elite traders found matching criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
