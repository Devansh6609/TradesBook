'use client'

import React, { useState, useEffect } from 'react'
import { Target, ArrowLeft, RefreshCw, CheckCircle2, Circle, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LevelData {
    level: number
    startingBalance: number
    percentageRisk: number
    risk: number | string
    profitGoal: number
    pips: number
    lotSize: number
    completed: boolean
}

export default function TwentyPipsChallengePage() {
    const [initialBalance, setInitialBalance] = useState(20)
    const [percentageRisk, setPercentageRisk] = useState(30)
    const [pips, setPips] = useState(20)
    const [numLevels, setNumLevels] = useState(30)

    const [completedLevels, setCompletedLevels] = useState<number[]>([])
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const saved = localStorage.getItem('20pips_completed_v1')
        if (saved) {
            try {
                setCompletedLevels(JSON.parse(saved))
            } catch (e) { }
        }

        const savedConfig = localStorage.getItem('20pips_config_v1')
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig)
                if (config.initialBalance) setInitialBalance(config.initialBalance)
                if (config.percentageRisk) setPercentageRisk(config.percentageRisk)
                if (config.pips) setPips(config.pips)
            } catch (e) { }
        }
    }, [])

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('20pips_completed_v1', JSON.stringify(completedLevels))
            localStorage.setItem('20pips_config_v1', JSON.stringify({
                initialBalance,
                percentageRisk,
                pips
            }))
        }
    }, [completedLevels, initialBalance, percentageRisk, pips, isMounted])

    const toggleLevel = (level: number) => {
        // Toggle only this level. If they skip, that's fine.
        setCompletedLevels(prev => {
            if (prev.includes(level)) {
                return prev.filter(l => l !== level)
            } else {
                return [...prev, level]
            }
        })
    }

    const resetChallenge = () => {
        if (confirm("Are you sure you want to completely reset your progress? This action cannot be undone.")) {
            setCompletedLevels([])
        }
    }

    // Generate table data
    const tableData: LevelData[] = []
    let currentBalance = initialBalance
    let previousProfitGoal = 0
    let currentLotSize = 0.01

    for (let i = 1; i <= numLevels; i++) {
        // Raw math before rounding 
        const profitGoalRaw = (currentBalance * percentageRisk) / 100
        const lotSizeRaw = profitGoalRaw / (pips * 10)

        // Truncate/round to get proper Lot Size for MT4/MT5 standard
        const lotSize = Math.max(0.01, Math.round(lotSizeRaw * 100) / 100)

        // Actual profit goal based on real rounded lot size
        const profitGoal = lotSize * pips * 10

        let risk: number | string = previousProfitGoal
        if (i === 1) {
            risk = "you decide"
        }

        tableData.push({
            level: i,
            startingBalance: currentBalance,
            percentageRisk,
            risk,
            profitGoal,
            pips,
            lotSize,
            completed: completedLevels.includes(i)
        })

        currentBalance += profitGoal
        previousProfitGoal = profitGoal
    }

    const calculateProgress = () => {
        if (tableData.length === 0) return 0;
        return (completedLevels.length / tableData.length) * 100;
    }

    const currentLevel = Math.min((completedLevels.length > 0 ? Math.max(...completedLevels) : 0) + 1, numLevels)

    const formatCurrency = (val: number | string) => {
        if (typeof val === 'string') return val
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
    }

    if (!isMounted) return null; // Avoid hydration mismatch

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header elements */}
            <div className="flex items-center gap-4 mb-6 animate-fade-up">
                <Link
                    href="/tools"
                    className="p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-400" />
                        20 Pips Challenge
                    </h1>
                    <p className="text-[var(--foreground-muted)]">Track your compound growth journey systematically</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
                {/* Configuration Sidebar */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-blue-400" /> Settings
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Initial Balance ($)</label>
                                <input
                                    type="number"
                                    value={initialBalance}
                                    onChange={(e) => setInitialBalance(Number(e.target.value))}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Percentage Risk (%)</label>
                                <input
                                    type="number"
                                    value={percentageRisk}
                                    onChange={(e) => setPercentageRisk(Number(e.target.value))}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Daily Pips Goal</label>
                                <input
                                    type="number"
                                    value={pips}
                                    onChange={(e) => setPips(Number(e.target.value))}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-[var(--border)]">
                            <div className="text-sm text-[var(--foreground)] mb-2">Current Progress</div>
                            <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden mb-2">
                                <div
                                    style={{ width: `${calculateProgress()}%`, transition: 'width 0.5s ease-out' }}
                                    className="h-full bg-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                                <span>{completedLevels.length} / {numLevels} Levels</span>
                                <span>{calculateProgress().toFixed(1)}%</span>
                            </div>

                            <button
                                onClick={resetChallenge}
                                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium"
                            >
                                <RefreshCw className="w-4 h-4" /> Reset Progress
                            </button>
                        </div>
                    </div>
                </div>

                {/* Challenge Table */}
                <div className="col-span-1 lg:col-span-3">
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
                        <div className="overflow-auto max-h-[calc(100vh-16rem)] min-h-[500px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--background-secondary)] text-[var(--foreground-muted)] uppercase text-xs sticky top-0 z-10 shadow-[0_1px_0_var(--border)]">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Lvl</th>
                                        <th className="px-4 py-3 font-medium">Start Bal.</th>
                                        <th className="px-4 py-3 font-medium">% Risk</th>
                                        <th className="px-4 py-3 font-medium">Risk</th>
                                        <th className="px-4 py-3 font-medium text-emerald-400">Profit Goal</th>
                                        <th className="px-4 py-3 font-medium">Pips</th>
                                        <th className="px-4 py-3 font-medium text-blue-400">Lot Size</th>
                                        <th className="px-4 py-3 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {tableData.map((row) => (
                                        <tr
                                            key={row.level}
                                            className={cn(
                                                "transition-colors hover:bg-[var(--background-secondary)]/50",
                                                row.completed ? "bg-emerald-500/5" : "",
                                                currentLevel === row.level ? "bg-blue-500/5 relative" : ""
                                            )}
                                        >
                                            <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                                                {row.level}
                                                {currentLevel === row.level && (
                                                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"></span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{formatCurrency(row.startingBalance)}</td>
                                            <td className="px-4 py-3">{row.percentageRisk}%</td>
                                            <td className="px-4 py-3 text-[var(--foreground-muted)]">{formatCurrency(row.risk)}</td>
                                            <td className="px-4 py-3 font-medium text-emerald-400">{formatCurrency(row.profitGoal)}</td>
                                            <td className="px-4 py-3">{row.pips}</td>
                                            <td className="px-4 py-3 font-semibold text-blue-400">{row.lotSize.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleLevel(row.level)}
                                                    className={cn(
                                                        "inline-flex items-center justify-center p-1.5 rounded-lg transition-all",
                                                        row.completed
                                                            ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                            : "text-[var(--foreground-muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                                                    )}
                                                >
                                                    {row.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
            @keyframes fade-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-up {
              animation: fade-up 0.5s ease-out forwards;
              opacity: 0;
            }
          `}</style>
        </div>
    )
}
