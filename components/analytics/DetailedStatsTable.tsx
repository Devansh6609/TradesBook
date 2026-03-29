'use client'

import { cn } from '@/lib/utils'

interface DetailedStatsTableProps {
    data: any // We will pass the full analyticsData object
}

export function DetailedStatsTable({ data }: DetailedStatsTableProps) {
    const formatCurrency = (val: string | number | undefined) => {
        if (val === undefined || val === null) return '$0.00'
        const num = typeof val === 'string' ? parseFloat(val) : val
        return num < 0 ? `-$${Math.abs(num).toFixed(2)}` : `$${num.toFixed(2)}`
    }

    const formatNumber = (val: string | number | undefined, decimals = 2) => {
        if (val === undefined || val === null) return '0'
        const num = typeof val === 'string' ? parseFloat(val) : val
        return num.toFixed(decimals).replace(/\.00$/, '')
    }

    const formatPercent = (val: string | number | undefined) => {
        if (val === undefined || val === null) return '0%'
        const num = typeof val === 'string' ? parseFloat(val) : val
        return `${num.toFixed(1)}%`
    }

    const extended = data.dailyExtendedStats || {}

    const statsLeft = [
        { label: 'Total P&L', value: formatCurrency(data?.totalPnL), color: parseFloat(data?.totalPnL || '0') >= 0 ? 'text-blue-400' : 'text-red-400' },
        { label: 'Average daily volume', value: formatNumber(data?.averageDailyVolume, 2), color: 'text-white' },
        { label: 'Average winning trade', value: formatCurrency(data?.averageWin), color: 'text-blue-400' },
        { label: 'Average losing trade', value: formatCurrency(data?.averageLoss), color: 'text-red-400' },
        { label: 'Total number of trades', value: formatNumber(data?.totalTrades, 0), color: 'text-white' },
        { label: 'Number of winning trades', value: formatNumber(data?.winningTrades, 0), color: 'text-blue-400' },
        { label: 'Number of losing trades', value: formatNumber(data?.losingTrades, 0), color: 'text-red-400' },
        { label: 'Number of break even trades', value: formatNumber(data?.breakEvenTrades, 0), color: 'text-white' },
        { label: 'Max consecutive wins', value: formatNumber(data?.maxConsecutiveWins, 0), color: 'text-blue-400' },
        { label: 'Max consecutive losses', value: formatNumber(data?.maxConsecutiveLosses, 0), color: 'text-red-400' },
        { label: 'Total commissions', value: formatCurrency(data?.totalCommissions || 0), color: 'text-white' },
        { label: 'Total swap', value: formatCurrency(data?.totalSwap || 0), color: 'text-white' },
        { label: 'Largest profit', value: formatCurrency(data?.bestTrade), color: 'text-blue-400' },
        { label: 'Largest loss', value: formatCurrency(data?.worstTrade), color: 'text-red-400' },
        { label: 'Avg hold time (All)', value: data?.holdTimeStats?.all || '-', color: 'text-white' },
        { label: 'Avg hold time (Winners)', value: data?.holdTimeStats?.winners || '-', color: 'text-white' },
        { label: 'Avg hold time (Losers)', value: data?.holdTimeStats?.losers || '-', color: 'text-white' },
    ]

    const statsRight = [
        { label: 'Open trades', value: formatNumber(data?.openTrades, 0), color: 'text-white' },
        { label: 'Total trading days', value: formatNumber(extended?.totalTradingDays, 0), color: 'text-white' },
        { label: 'Winning days', value: formatNumber(extended?.winningDays, 0), color: 'text-blue-400' },
        { label: 'Losing days', value: formatNumber(extended?.losingDays, 0), color: 'text-red-400' },
        { label: 'Breakeven days', value: formatNumber(extended?.breakevenDays, 0), color: 'text-white' },
        { label: 'Max consecutive winning days', value: formatNumber(extended?.maxConsecutiveWinningDays, 0), color: 'text-blue-400' },
        { label: 'Max consecutive losing days', value: formatNumber(extended?.maxConsecutiveLosingDays, 0), color: 'text-red-400' },
        { label: 'Average daily P&L', value: formatCurrency(extended?.averageDailyPnL), color: (extended?.averageDailyPnL || 0) >= 0 ? 'text-blue-400' : 'text-red-400' },
        { label: 'Average winning day P&L', value: formatCurrency(extended?.averageWinningDayPnL), color: 'text-blue-400' },
        { label: 'Average losing day P&L', value: formatCurrency(extended?.averageLosingDayPnL), color: 'text-red-400' },
        { label: 'Largest profitable day', value: formatCurrency(extended?.largestProfitableDay), color: 'text-blue-400' },
        { label: 'Largest losing day', value: formatCurrency(extended?.largestLosingDay), color: 'text-red-400' },
        { label: 'Trade expectancy', value: formatCurrency(data?.expectancy), color: parseFloat(data?.expectancy || '0') >= 0 ? 'text-blue-400' : 'text-red-400' },
        { label: 'Max drawdown', value: formatCurrency(-(data?.maxDrawdown || 0)), color: 'text-red-400' },
        { label: 'Max drawdown %', value: formatPercent(data?.maxDrawdownPercent), color: 'text-red-400' },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm mt-8">
            {/* Left Column */}
            <div className="space-y-4">
                {statsLeft.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-[var(--border)]/30 border-dashed">
                        <span className="text-[var(--foreground-muted)]">{stat.label}</span>
                        <span className={cn("font-medium font-mono text-right", stat.color)}>{stat.value}</span>
                    </div>
                ))}
            </div>
            {/* Right Column */}
            <div className="space-y-4">
                {statsRight.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-[var(--border)]/30 border-dashed">
                        <span className="text-[var(--foreground-muted)]">{stat.label}</span>
                        <span className={cn("font-medium font-mono text-right", stat.color)}>{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
