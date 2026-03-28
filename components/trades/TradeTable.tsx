import { useState } from 'react'
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
  MoreHorizontal,
  ExternalLink,
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

  const handleSort = (field: SortField) => {
    onSort(field)
  }

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-foreground-muted" />
    if (sortOrder === 'asc') return <ArrowUp size={14} className="text-blue-500" />
    return <ArrowDown size={14} className="text-blue-500" />
  }

  const allSelected = trades.length > 0 && trades.every((t) => selectedTrades.includes(t.id))
  const someSelected = trades.some((t) => selectedTrades.includes(t.id)) && !allSelected

  if (loading) {
    return (
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-background-tertiary border-b border-border" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-border last:border-b-0">
              <div className="h-full bg-background-tertiary/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background-tertiary">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-border bg-background-tertiary text-blue-500 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center gap-1">
                    Symbol
                    {getSortIcon('symbol')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Direction
                    {getSortIcon('type')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Entry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Exit
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center gap-1">
                    P&L
                    {getSortIcon('pnl')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('entryDate')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {getSortIcon('entryDate')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-foreground-muted">
                    No trades found. Add your first trade to get started.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className={cn(
                      'hover:bg-background-tertiary/50 transition-colors',
                      selectedTrades.includes(trade.id) && 'bg-blue-500/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTrades.includes(trade.id)}
                        onChange={(e) => onSelectTrade(trade.id, e.target.checked)}
                        className="rounded border-border bg-background-tertiary text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={trade.symbol} size="md" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">{trade.symbol}</span>
                          {trade.strategy && (
                            <Badge variant="neutral" size="sm" className="mt-1 w-fit">
                              {trade.strategy.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={trade.type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-foreground">
                          {parseFloat(trade.entryPrice?.toString() || '0').toFixed(5)}
                        </div>
                        <div className="text-xs text-foreground-muted">
                          {parseFloat(trade.quantity?.toString() || '0').toFixed(2)} units
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {trade.exitPrice ? (
                        <div className="text-sm font-medium text-foreground">
                          {parseFloat(trade.exitPrice?.toString() || '0').toFixed(5)}
                        </div>
                      ) : (
                        <span className="text-sm text-foreground-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {trade.pnl !== undefined && trade.pnl !== null ? (
                        <div className="space-y-0.5">
                          <div className={cn('text-sm font-semibold', getPnLColor(trade.netPnl || trade.pnl))}>
                            {formatPnL(trade.netPnl || trade.pnl)}
                          </div>
                          {trade.pnlPercentage && (
                            <div className={cn('text-xs', getPnLColor(trade.pnlPercentage))}>
                              {parseFloat(trade.pnlPercentage?.toString() || '0').toFixed(2)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-foreground-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="text-sm text-foreground">
                          {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-foreground-muted">
                          {format(new Date(trade.entryDate), 'HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={trade.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/journal/${trade.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit(trade)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-loss hover:text-loss hover:bg-loss/10"
                          onClick={() => onDelete(trade)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground-muted">
            Showing {startItem} to {endItem} of {totalCount} trades
          </span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 text-sm rounded-md border border-border bg-background-tertiary text-foreground focus:outline-none focus:border-blue-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-foreground-muted px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
