import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Trade } from '@/types'
import { formatPnL, getPnLColor } from '@/lib/trades'
import { cn } from '@/lib/utils'
import {
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Pencil,
    Trash2,
    Share2,
    Target,
} from 'lucide-react'
import { format } from 'date-fns'
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
    onShare?: (trade: Trade) => void
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
    onShare,
    selectedTrades,
    onSelectTrade,
    onSelectAll,
    loading,
}: TradeTableProps) {
    const totalPages = Math.ceil(totalCount / limit)
    const startItem = (page - 1) * limit + 1
    const endItem = Math.min(page * limit, totalCount)


    const handleSort = (field: SortField) => {
        onSort(field)
    }

    const getSortIcon = (field: SortField) => {
        if (sortBy !== field) return <ArrowUpDown size={12} className="text-foreground-muted/20" />
        if (sortOrder === 'asc') return <ArrowUp size={12} className="text-blue-400" />
        return <ArrowDown size={12} className="text-blue-400" />
    }

    const allSelected = trades.length > 0 && trades.every((t) => selectedTrades.includes(t.id))
    const someSelected = trades.some((t) => selectedTrades.includes(t.id)) && !allSelected

    const tableHeaders = [
        { label: 'OPEN / CLOSE', sortField: 'entryDate' as SortField },
        { label: 'SYMBOL', sortField: 'symbol' as SortField },
        { label: 'TYPE', sortField: 'type' as SortField },
        { label: 'ENTRY', sortField: 'entryPrice' as SortField },
        { label: 'EXIT', sortField: 'exitPrice' as SortField },
        { label: 'SIZE', sortField: 'pnl' as SortField }, // Size is usually quantity, but keeping sort consistency
        { label: 'P&L', sortField: 'pnl' as SortField },
        { label: 'SOURCE', sortField: null },
    ]

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
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-4 w-10">
                                <input
                                    type="checkbox"
                                    title="Select all trades"
                                    checked={allSelected}
                                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                                />
                            </th>
                            {tableHeaders.map((header) => (
                                <th 
                                    key={header.label}
                                    onClick={() => header.sortField && handleSort(header.sortField)} 
                                    className={cn("px-4 py-4", header.sortField && "cursor-pointer group/th")}
                                >
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#475569] group-hover/th:text-white transition-colors">
                                        {header.label}
                                        {header.sortField && getSortIcon(header.sortField)}
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-4 text-right w-24" />
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                        {trades.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-foreground-disabled/20 border border-white/5">
                                            <Target size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-foreground-disabled">No trades found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            trades.map((trade) => {
                                const isProfit = (trade.netPnl || trade.pnl || 0) >= 0;
                                return (
                                    <tr 
                                        key={trade.id} 
                                        className={cn(
                                            "group/row hover:bg-white/[0.02] border-b border-white/5 transition-colors cursor-pointer",
                                            selectedTrades.includes(trade.id) && "bg-blue-500/[0.03]"
                                        )}
                                    >
                                        <td className="px-4 py-4 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                title={`Select trade ${trade.symbol}`}
                                                checked={selectedTrades.includes(trade.id)}
                                                onChange={(e) => onSelectTrade(trade.id, e.target.checked)}
                                                className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                                            />
                                        </td>

                                    {/* Open / Close */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-white leading-tight">
                                                {format(new Date(trade.entryDate), 'MMM d, HH:mm')}
                                            </span>
                                            {trade.exitDate && (
                                                <span className="text-[11px] font-medium text-foreground-disabled">
                                                    {format(new Date(trade.exitDate), 'MMM d, HH:mm')}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Symbol */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <AssetIcon symbol={trade.symbol} size="xs" />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-extrabold text-white leading-tight uppercase">{trade.symbol}</span>
                                                <span className="text-[10px] font-bold text-foreground-disabled tracking-widest uppercase">Forex</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                            trade.type === 'BUY' 
                                                ? "text-blue-400 bg-blue-500/5 border-blue-500/10" 
                                                : "text-red-400 bg-red-500/5 border-red-500/10"
                                        )}>
                                            {trade.type}
                                        </span>
                                    </td>

                                    {/* Entry */}
                                    <td className="px-4 py-4">
                                        <span className="text-[13px] font-bold text-white">
                                            {parseFloat(trade.entryPrice?.toString() || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                                        </span>
                                    </td>

                                    {/* Exit */}
                                    <td className="px-4 py-4">
                                        {trade.exitPrice ? (
                                            <span className="text-[13px] font-bold text-white">
                                                {parseFloat(trade.exitPrice?.toString() || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold text-blue-500 tracking-wider">OPEN</span>
                                        )}
                                    </td>

                                    {/* Size */}
                                    <td className="px-4 py-4">
                                        <span className="text-[13px] font-bold text-white">
                                            {parseFloat(trade.quantity?.toString() || '0').toFixed(2)}
                                        </span>
                                    </td>

                                    {/* P&L */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-[13px] font-black tracking-tight",
                                                isProfit ? "text-blue-400" : "text-red-400"
                                            )}>
                                                {isProfit ? '+' : ''}{formatPnL(trade.netPnl || trade.pnl)}
                                            </span>
                                            <span className="text-[10px] font-bold text-foreground-disabled uppercase tracking-widest">
                                                0.00 PIPS
                                            </span>
                                        </div>
                                    </td>

                                    {/* Source */}
                                    <td className="px-4 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111111] border border-white/5 text-[11px] font-bold text-[#8c97ad]">
                                            <Pencil size={10} />
                                            Manual
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                                                title="Edit trade"
                                                className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-disabled hover:text-white transition-colors"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onShare) onShare(trade);
                                                    else {
                                                        navigator.clipboard.writeText(window.location.origin + '/trades/' + trade.id);
                                                        alert('Trade link copied to clipboard!');
                                                    }
                                                }}
                                                title="Share trade"
                                                className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-disabled hover:text-white transition-colors"
                                            >
                                                <Share2 size={15} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(trade); }}
                                                title="Delete trade"
                                                className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-disabled hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4 border-t border-white/5">
                <div className="text-xs font-semibold text-foreground-disabled">
                    Showing {startItem} to {endItem} of {totalCount} trades
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            title="Previous page"
                            className="p-2 rounded-lg bg-[#111111] border border-white/5 disabled:opacity-30 hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold px-2 text-white">
                            {page}
                        </span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            title="Next page"
                            className="p-2 rounded-lg bg-[#111111] border border-white/5 disabled:opacity-30 hover:bg-white/5 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    <select
                        value={limit}
                        title="Trades per page"
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="bg-[#111111] border border-white/5 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                        {[10, 25, 50, 100].map(v => (
                            <option key={v} value={v}>{v} / page</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}


