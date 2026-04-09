'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import AITradingAnalyzer from '@/components/analytics/AITradingAnalyzer'
import { api } from '@/lib/apiClient'

export default function AIReportPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['trades', 'ai-report'],
        queryFn: () => api.trades.list({ limit: 1000, status: 'CLOSED' }),
    })

    const trades = data?.trades || []

    const closedTrades = trades
        .filter((t: any) => t.status === 'CLOSED')
        .map((t: any) => ({
            symbol: t.symbol,
            type: t.type,
            pnl: parseFloat(t.pnl || '0'),
            netPnl: t.netPnl ? parseFloat(t.netPnl) : undefined,
            entryDate: t.entryDate,
            exitDate: t.exitDate,
            quantity: t.quantity || 1,
            entryEmotion: t.entryEmotion,
            exitEmotion: t.exitEmotion,
            marketCondition: t.marketCondition,
            strategyId: t.strategyId,
            preTradeAnalysis: t.preTradeAnalysis,
            postTradeAnalysis: t.postTradeAnalysis,
            lessonsLearned: t.lessonsLearned,
            rMultiple: t.rMultiple,
            entryPrice: t.entryPrice ? parseFloat(t.entryPrice) : undefined,
            exitPrice: t.exitPrice ? parseFloat(t.exitPrice) : undefined,
        }))

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <AITradingAnalyzer trades={closedTrades} />
        </div>
    )
}
