import { LeaderboardTable } from "@/components/community/LeaderboardTable"
import { LoungeFeed } from "@/components/community/LoungeFeed"
import { Globe, Users, TrendingUp, TrendingDown, Award } from "lucide-react"

export const metadata = {
    title: 'Community Terminal | TradeFXBook',
}

export default function CommunityPage() {
    return (
        <div className="max-w-[1600px] mx-auto pb-12 px-4 md:px-8 animate-fade-in relative z-10 pt-6">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    Elite Traders Lounge
                    <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs tracking-widest uppercase border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        Global Hub
                    </span>
                </h1>
                <p className="text-[var(--foreground-muted)] font-medium mt-2">
                    Connect with professional nodes, analyze market flow, and track global leaderboards.
                </p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[800px]">

                {/* Left Column: Leaderboard (5 cols) */}
                <div className="lg:col-span-6 xl:col-span-5 flex flex-col h-full gap-6">
                    <LeaderboardTable />
                </div>

                {/* Center Column: Lounge Feed (4 cols) */}
                <div className="lg:col-span-6 xl:col-span-4 flex flex-col h-full">
                    <LoungeFeed />
                </div>

                {/* Right Column: Active Terminal Stats (3 cols) */}
                <div className="hidden xl:flex xl:col-span-3 flex-col h-full gap-6">

                    {/* User Status Widget */}
                    <div className="glass-obsidian rounded-3xl p-6 border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Node Status</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                <span className="text-xs font-bold text-slate-500 dark:text-[var(--foreground-muted)] uppercase">Global Rank</span>
                                <span className="font-mono font-black text-slate-900 dark:text-white">#--</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                <span className="text-xs font-bold text-slate-500 dark:text-[var(--foreground-muted)] uppercase">Reputation</span>
                                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                    0
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Market Sentiment / Trending */}
                    <div className="glass-obsidian rounded-3xl p-6 border-black/5 dark:border-white/5 flex-1 h-auto min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur pb-2 z-10 w-full pt-1">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Network Flow</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-[var(--foreground-muted)] mb-3">Trending Pairs</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 group hover:border-emerald-500/30 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                            <span className="font-black text-slate-900 dark:text-white text-sm">XAUUSD</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                            <TrendingUp className="w-3 h-3" /> Bullish
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 group hover:border-red-500/30 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                                            <span className="font-black text-slate-900 dark:text-white text-sm">EURUSD</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold">
                                            <TrendingDown className="w-3 h-3" /> Bearish
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-[var(--foreground-muted)]">Active Nodes</h4>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1">
                                        <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" /> 24
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
