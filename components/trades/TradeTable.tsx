import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge, PnLBadge, TypeBadge, StatusBadge } from '@/components/ui/Badge'
import { Trade } from '@/types'
import { formatPnL, getPnLColor } from '@/lib/trades'
import { cn } from '@/lib/utils'
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Edit2,
    Trash2,
    ExternalLink,
    Target,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    History as HistoryIcon,
    AlertCircle,
} from 'lucide-react'
import { format, isSameDay, startOfDay } from 'date-fns'
import { AssetIcon } from "@/components/market/AssetIcon"

type SortField = 'symbol' | 'type' | 'entryPrice' | 'exitPrice' | 'pnl' | 'entryDate' | 'status'
type SortOrder = 'asc' | 'desc'

interface TradeTableProps {
    trades: Trade[]
    totalCount: number
    page: number
    limit: number
    sortBy: SortField
    sortOrder: SortOrder
    onSort: (field: SortField) => void
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
    onEdit: (trade: Trade) => void
    onDelete: (trade: Trade) => void
    selectedTrades: string[]
    onSelectTrade: (tradeId: string, selected: boolean) => void
    onSelectAll: (selected: boolean) => void
    loading?: boolean
}

export function TradeTable({
    trades,
    totalCount,
    page,
    limit,
    sortBy,
    sortOrder,
    onSort,
    onPageChange,
    onLimitChange,
    onEdit,
    onDelete,
    selectedTrades,
    onSelectTrade,
    onSelectAll,
    loading,
}: TradeTableProps) {
    const totalPages = Math.ceil(totalCount / limit)
    const startItem = (page - 1) * limit + 1
    const endItem = Math.min(page * limit, totalCount)

    // Group trades by date
    const groupedTrades = useMemo(() => {
        const groups: { date: Date; trades: Trade[] }[] = []
        
        trades.forEach((trade) => {
            const date = startOfDay(new Date(trade.entryDate))
            const existingGroup = groups.find((g) => isSameDay(g.date, date))
            
            if (existingGroup) {
                existingGroup.trades.push(trade)
            } else {
                groups.push({ date, trades: [trade] })
            }
        })
        
        return groups.sort((a, b) => b.date.getTime() - a.date.getTime())
    }, [trades])

    const handleSort = (field: SortField) => {
        onSort(field)
    }

    const getSortIcon = (field: SortField) => {
        if (sortBy !== field) return <ArrowUpDown size={12} className="text-foreground-muted/20" />
        if (sortOrder === 'asc') return <ArrowUp size={12} className="text-blue-400 animate-in zoom-in" />
        return <ArrowDown size={12} className="text-blue-400 animate-in zoom-in" />
    }

    const allSelected = trades.length > 0 && trades.every((t) => selectedTrades.includes(t.id))
    const someSelected = trades.some((t) => selectedTrades.includes(t.id)) && !allSelected

    if (loading) {
        return (
            <div className="bg-background-secondary/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="animate-pulse">
                    <div className="h-14 bg-white/5 border-b border-white/5" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 border-b border-white/5 last:border-b-0 flex items-center px-8 gap-6">
                            <div className="w-10 h-10 rounded-xl bg-white/5" />
                            <div className="flex-1 space-y-3">
                                <div className="h-3 w-32 bg-white/5 rounded-full" />
                                <div className="h-2 w-24 bg-white/5/50 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="bg-background-secondary/30 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/5 group relative">
                {/* Subtle Scanline Overlay */}
                <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02] sticky top-0 z-20 backdrop-blur-2xl">
                                <th className="px-6 py-5 w-12">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            title="Select All"
                                            checked={allSelected}
                                            ref={(el) => { if (el) el.indeterminate = someSelected }}
                                            onChange={(e) => onSelectAll(e.target.checked)}
                                            className="rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500/20 w-4.5 h-4.5 cursor-pointer transition-all active:scale-90"
                                        />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('entryDate')} className="px-6 py-5 cursor-pointer group/th">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled group-hover/th:text-blue-400 transition-colors">
                                        Open / Close
                                        {getSortIcon('entryDate')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('symbol')} className="px-6 py-5 cursor-pointer group/th">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled group-hover/th:text-blue-400 transition-colors">
                                        Asset
                                        {getSortIcon('symbol')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('type')} className="px-5 py-5 cursor-pointer group/th">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled group-hover/th:text-blue-400 transition-colors">
                                        Type
                                        {getSortIcon('type')}
                                    </div>
                                </th>
                                <th className="px-5 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled">Entry / Size</span>
                                </th>
                                <th onClick={() => handleSort('exitPrice')} className="px-5 py-5 cursor-pointer group/th">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled group-hover/th:text-blue-400 transition-colors">
                                        Exit
                                        {getSortIcon('exitPrice')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('pnl')} className="px-5 py-5 cursor-pointer group/th">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled group-hover/th:text-blue-400 transition-colors">
                                        P&L Gross
                                        {getSortIcon('pnl')}
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-right w-24">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled">Action</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                            {groupedTrades.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-32 text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent" />
                                        <div className="flex flex-col items-center gap-4 relative z-10">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                                                <div className="w-16 h-16 rounded-3xl bg-black/40 flex items-center justify-center text-blue-500/40 border border-white/5 shadow-2xl relative">
                                                    <Target size={32} className="animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-foreground uppercase tracking-widest">No Active Vectors Found</p>
                                                <p className="text-[10px] text-foreground-disabled/60 uppercase tracking-tighter">Enter a position to initialize telemetry</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                groupedTrades.map((group) => (
                                    <React.Fragment key={group.date.toISOString()}>
                                        {/* Date Sub-Header */}
                                        <tr className="bg-white/[0.01] border-b border-white/5">
                                            <td colSpan={8} className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] shadow-sm">
                                                        <HistoryIcon size={10} className="text-blue-500" />
                                                        {format(group.date, 'EEEE, d MMMM yyyy').toUpperCase()}
                                                    </div>
                                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Trades for this date */}
                                        {group.trades.map((trade) => (
                                            <tr
                                                key={trade.id}
                                                className={cn(
                                                    'hover:bg-white/[0.04] transition-all duration-300 group/row relative overflow-hidden',
                                                    selectedTrades.includes(trade.id) && 'bg-blue-500/[0.03] hover:bg-blue-500/[0.06]'
                                                )}
                                            >
                                                {/* Select Column */}
                                                <td className="px-6 py-4.5 relative z-10">
                                                    <input
                                                        type="checkbox"
                                                        title="Select Trade"
                                                        checked={selectedTrades.includes(trade.id)}
                                                        onChange={(e) => onSelectTrade(trade.id, e.target.checked)}
                                                        className="rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500/20 w-4 h-4 cursor-pointer transition-all active:scale-90"
                                                    />
                                                </td>

                                                {/* Stacked Timestamps */}
                                                <td className="px-6 py-4.5 relative z-10">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 group/time">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 border border-blue-400/50" />
                                                            <span className="text-[10px] font-bold text-foreground font-mono tracking-tight">
                                                                {format(new Date(trade.entryDate), 'HH:mm:ss')}
                                                            </span>
                                                            <span className="text-[8px] font-black text-foreground-disabled/50 uppercase tracking-tighter">OPEN</span>
                                                        </div>
                                                        {trade.exitDate && (
                                                            <div className="flex items-center gap-2 group/time opacity-60 group-hover/row:opacity-100 transition-opacity">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10 border border-white/20" />
                                                                <span className="text-[10px] font-bold text-foreground font-mono tracking-tight">
                                                                    {format(new Date(trade.exitDate), 'HH:mm:ss')}
                                                                </span>
                                                                <span className="text-[8px] font-black text-foreground-disabled/50 uppercase tracking-tighter">CLOSED</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Symbol */}
                                                <td className="px-6 py-4.5 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                                            <AssetIcon symbol={trade.symbol} size="md" className="relative z-10 bg-black/40 p-1 rounded-lg border border-white/5 group-hover/row:scale-110 transition-transform" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-foreground text-xs tracking-wider uppercase">{trade.symbol}</span>
                                                            <span className="text-[9px] font-bold text-foreground-disabled uppercase tracking-tighter opacity-70">
                                                                {trade.strategy?.name || 'TERMINAL_MANUAL_01'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type Badge */}
                                                <td className="px-5 py-4.5 relative z-10">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all",
                                                        trade.type === 'BUY'
                                                            ? "bg-profit-dark/10 text-profit border-profit-dark/20"
                                                            : "bg-loss-dark/10 text-loss border-loss-dark/20"
                                                    )}>
                                                        {trade.type === 'BUY' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                        {trade.type === 'BUY' ? 'LONG' : 'SHORT'}
                                                    </div>
                                                </td>

                                                {/* Entry / Size */}
                                                <td className="px-5 py-4.5 relative z-10">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-black font-mono text-foreground tracking-tight">
                                                            {parseFloat(trade.entryPrice?.toString() || '0').toFixed(5)}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">VOL_LTS</span>
                                                            <span className="text-[10px] font-bold text-foreground font-mono">
                                                                {parseFloat(trade.quantity?.toString() || '0').toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Exit */}
                                                <td className="px-5 py-4.5 relative z-10">
                                                    {trade.exitPrice ? (
                                                        <span className="text-[11px] font-black font-mono text-foreground tracking-tight group-hover/row:text-blue-400 transition-colors">
                                                            {parseFloat(trade.exitPrice?.toString() || '0').toFixed(5)}
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group-hover/row:translate-x-1 transition-transform">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-[pulse_1s_infinite]" />
                                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Live</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* P&L */}
                                                <td className="px-5 py-4.5 relative z-10">
                                                    {trade.pnl !== undefined && trade.pnl !== null ? (
                                                        <div className="flex flex-col group/pnl">
                                                            <div className={cn('text-xs font-black font-mono tracking-tight', getPnLColor(trade.netPnl || trade.pnl))}>
                                                                {formatPnL(trade.netPnl || trade.pnl)}
                                                            </div>
                                                            {trade.pnlPercentage && (
                                                                <div className={cn('text-[9px] font-black mt-0.5 tracking-tighter', getPnLColor(trade.pnlPercentage))}>
                                                                    {trade.pnlPercentage > 0 ? 'ALPHA_UP' : 'SIGMA_DN'} {Math.abs(parseFloat(trade.pnlPercentage?.toString() || '0')).toFixed(2)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 opacity-20">
                                                            <div className="h-1 w-12 bg-white/40 rounded-full" />
                                                            <div className="h-0.5 w-8 bg-white/20 rounded-full" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4.5 text-right relative z-10">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-2 group-hover/row:translate-x-0">
                                                        <Link href={`/journal/${trade.id}`} title="View Telemetry">
                                                            <button title="View Data" className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-blue-600 hover:text-white border border-white/5 transition-all active:scale-95 shadow-lg">
                                                                <ExternalLink size={14} />
                                                            </button>
                                                        </Link>
                                                        <button
                                                            title="Edit Entry"
                                                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-blue-600 hover:text-white border border-white/5 transition-all active:scale-95 shadow-lg"
                                                            onClick={() => onEdit(trade)}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            title="Purge Vector"
                                                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-loss hover:text-white border border-white/5 transition-all active:scale-95 shadow-lg"
                                                            onClick={() => onDelete(trade)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Terminal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 px-4 py-6 border border-white/5 bg-white/[0.01] rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-8">
                    <div className="flex -space-x-1.5 items-center">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full border border-black bg-blue-500/20" />
                        ))}
                        <div className="ml-6 flex flex-col">
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground-disabled leading-none mb-1">Telemetry Buffer</span>
                           <span className="text-[10px] font-bold text-foreground/70 font-mono italic">
                                S_OFF: {startItem} | E_OFF: {endItem} | TOTAL: {totalCount}
                           </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-2xl backdrop-blur-3xl">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={page === 1}
                        title="Init Buffer"
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 disabled:opacity-20 transition-all text-white border border-white/5 active:scale-95 group/p"
                    >
                        <ChevronsLeft size={16} className="group-hover/p:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        title="Prev State"
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 disabled:opacity-20 transition-all text-white border border-white/5 active:scale-95 group/p"
                    >
                        <ChevronLeft size={16} className="group-hover/p:-translate-x-0.5 transition-transform" />
                    </button>
                    
                    <div className="px-6 flex items-center gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none mb-1.5">State_ID</span>
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-50" />
                                <span className="relative text-sm font-black text-white font-mono bg-blue-600/10 px-4 py-1 rounded border border-blue-500/30 min-w-[32px] text-center inline-block">
                                    {page}
                                </span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-foreground-disabled uppercase tracking-[0.2em] leading-none mb-1.5">Total_Cyc</span>
                            <span className="text-[11px] font-bold font-mono text-white/50">
                                {totalPages}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                        title="Next State"
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 disabled:opacity-20 transition-all text-white border border-white/5 active:scale-95 group/p"
                    >
                        <ChevronRight size={16} className="group-hover/p:translate-x-0.5 transition-transform" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={page === totalPages}
                        title="Halt Buffer"
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 disabled:opacity-20 transition-all text-white border border-white/5 active:scale-95 group/p"
                    >
                        <ChevronsRight size={16} className="group-hover/p:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <select
                        value={limit}
                        title="Resolution"
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="relative pl-4 pr-10 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer shadow-2xl"
                    >
                        <option value={10}>10_NODES</option>
                        <option value={25}>25_NODES</option>
                        <option value={50}>50_NODES</option>
                        <option value={100}>100_NODES</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-disabled group-hover:text-blue-400 transition-colors">
                        <ArrowDown size={12} />
                    </div>
                </div>
            </div>
        </div>
    )
}


