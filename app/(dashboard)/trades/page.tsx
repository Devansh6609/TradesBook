'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { TradeTable } from '@/components/trades/TradeTable'
import { TradeFilters, TradeFiltersState } from '@/components/trades/TradeFilters'
import { TradeForm } from '@/components/trades/TradeForm'
import { ImportModal } from '@/components/trades/ImportModal'
import { Trade } from '@/types'
import { Plus, Filter, Link2, AlertCircle, Trash2, Download, Upload, TrendingUp, History } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { HistorySyncModal } from '@/components/trades/HistorySyncModal'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { api } from '@/lib/apiClient'

type SortField = 'symbol' | 'type' | 'entryPrice' | 'exitPrice' | 'pnl' | 'entryDate' | 'status'
type SortOrder = 'asc' | 'desc'

interface TradesResponse {
  trades: Trade[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  stats: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalPnl: string
    totalNetPnl: string
  }
}

export default function TradesPage() {
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sortBy, setSortBy] = useState<SortField>('entryDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TradeFiltersState>({
    symbol: '',
    type: '',
    status: '',
    strategyId: '',
    dateFrom: null,
    dateTo: null,
    minPnl: '',
    maxPnl: '',
  })
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    params.append('sortBy', sortBy)
    params.append('sortOrder', sortOrder)

    if (filters.symbol) params.append('symbol', filters.symbol)
    if (filters.type) params.append('type', filters.type)
    if (filters.status) params.append('status', filters.status)
    if (filters.strategyId) params.append('strategyId', filters.strategyId)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString())
    if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())
    if (filters.minPnl) params.append('minPnl', filters.minPnl)
    if (filters.maxPnl) params.append('maxPnl', filters.maxPnl)

    return params.toString()
  }, [page, limit, sortBy, sortOrder, filters])

  // Fetch trades
  const { data, isLoading, error } = useQuery({
    queryKey: ['trades', page, limit, sortBy, sortOrder, filters],
    queryFn: () => api.trades.list({
      page,
      limit,
      sortBy,
      sortOrder,
      symbol: filters.symbol,
      type: filters.type,
      status: filters.status,
      strategyId: filters.strategyId,
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString(),
      minPnl: filters.minPnl ? parseFloat(filters.minPnl) : undefined,
      maxPnl: filters.maxPnl ? parseFloat(filters.maxPnl) : undefined,
    }),
  })

  // Fetch strategies
  const { data: strategiesData } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => api.strategies.list(),
  })

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.tags.list(),
  })

  // Create/Update trade mutation
  const saveTradeMutation = useMutation({
    mutationFn: (tradeData: any) => {
      if (editingTrade) {
        return api.trades.update(editingTrade.id, tradeData)
      }
      return api.trades.create(tradeData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      setIsFormOpen(false)
      setEditingTrade(null)
      toast.success(editingTrade ? 'Trade updated!' : 'Trade created!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to save trade: ${error.message}`)
    },
  })

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: (tradeId: string) => api.trades.delete(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      setDeletingTrade(null)
      setSelectedTrades((prev) => prev.filter((id) => id !== deletingTrade?.id))
      toast.success('Trade deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete trade')
    },
  })

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Handle trade selection
  const handleSelectTrade = (tradeId: string, selected: boolean) => {
    if (selected) {
      setSelectedTrades((prev) => [...prev, tradeId])
    } else {
      setSelectedTrades((prev) => prev.filter((id) => id !== tradeId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTrades(data?.trades.map((t) => t.id) || [])
    } else {
      setSelectedTrades([])
    }
  }

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade)
    setIsFormOpen(true)
  }

  const handleDelete = (trade: Trade) => {
    setDeletingTrade(trade)
  }

  const confirmDelete = () => {
    if (deletingTrade) {
      deleteTradeMutation.mutate(deletingTrade.id)
    }
  }

  const handleExport = () => {
    const trades = data?.trades || []
    const csvContent = [
      ['Symbol', 'Type', 'Entry Price', 'Exit Price', 'Entry Date', 'Exit Date', 'Quantity', 'P&L', 'Net P&L', 'Status', 'Strategy'].join(','),
      ...trades.map((t) =>
        [t.symbol, t.type, t.entryPrice, t.exitPrice || '', t.entryDate, t.exitDate || '', t.quantity, t.pnl || '', t.netPnl || '', t.status, t.strategy?.name || ''].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trades_export_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['trades'] })
    setIsImportOpen(false)
  }

  const trades = data?.trades || []
  const stats = data?.stats
  const strategies = strategiesData?.strategies || []
  const tags = tagsData?.tags || []
  const totalTrades = data?.pagination.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Trades</h1>
          <p className="text-[var(--foreground-muted)] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--foreground-muted)]" />
            Not connected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="gap-2 bg-blue-600 hover:bg-blue-700 border-0 text-white"
            onClick={() => {/* Open connect modal */ }}
          >
            <Link2 size={18} />
            Connect MT4/MT5
          </Button>
          <Button
            variant="secondary"
            className="gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-blue-500/30 text-blue-400 hover:from-purple-600/30 hover:to-blue-600/30"
            onClick={() => setIsSyncModalOpen(true)}
          >
            <History size={18} />
            Sync History
          </Button>
          <Button
            variant="secondary"
            className="gap-2 border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload size={18} />
            Import CSV
          </Button>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setEditingTrade(null)
              setIsFormOpen(true)
            }}
          >
            <Plus size={18} />
            Add Trade
          </Button>
        </div>

      </div>

      {/* Trade History Card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
        {/* Card Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Trade History</h2>
            <span className="text-sm text-[var(--foreground-muted)]">{totalTrades} of {totalTrades} trades</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              showFilters && "bg-blue-600/10 text-blue-400"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </Button>
        </div>

        {/* Free Plan Notice */}
        <div className="mx-4 mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400">
            Free plan loads <span className="font-semibold underline cursor-pointer">your last 15 trades</span>. Upgrade to Pro to unlock full history and longer timeframes.
          </p>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-[var(--border)]">
            <TradeFilters
              filters={filters}
              onChange={setFilters}
              strategies={strategies}
            />
          </div>
        )}

        {/* Trade Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-muted)] border-b border-[var(--border)]">
                <th className="px-4 py-3 font-medium">OPEN / CLOSE</th>
                <th className="px-4 py-3 font-medium">SYMBOL</th>
                <th className="px-4 py-3 font-medium">TYPE</th>
                <th className="px-4 py-3 font-medium">ENTRY</th>
                <th className="px-4 py-3 font-medium">EXIT</th>
                <th className="px-4 py-3 font-medium">SIZE</th>
                <th className="px-4 py-3 font-medium">P&L</th>
                <th className="px-4 py-3 font-medium">SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-gray-500">Loading trades...</p>
                    </div>
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-4">
                        <Filter className="w-8 h-8 text-[var(--foreground-muted)]" />
                      </div>
                      <p className="text-[var(--foreground-muted)] mb-2">No trades match your filters</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({
                          symbol: '',
                          type: '',
                          status: '',
                          strategyId: '',
                          dateFrom: null,
                          dateTo: null,
                          minPnl: '',
                          maxPnl: '',
                        })}
                        className="text-gray-500"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--foreground)]/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm space-y-0.5">
                        <p className="text-[var(--foreground-muted)]">
                          <span className="text-[var(--foreground-disabled)] mr-1">Open:</span>
                          {format(new Date(trade.entryDate), 'MMM d hh:mm a')}
                        </p>
                        {trade.exitDate && (
                          <p className="text-[var(--foreground-muted)]">
                            <span className="text-[var(--foreground-disabled)] mr-1">Close:</span>
                            {format(new Date(trade.exitDate), 'MMM d hh:mm a')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span className="text-[var(--foreground)] font-medium">{trade.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded flex items-center gap-1 w-fit",
                        trade.type === 'BUY'
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        <TrendingUp size={12} className={trade.type === 'BUY' ? '' : 'rotate-180'} />
                        {trade.type === 'BUY' ? 'Long' : 'Short'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">${trade.entryPrice}</td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{trade.exitPrice ? `$${trade.exitPrice}` : '-'}</td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{trade.quantity}</td>
                    <td className={cn(
                      "px-4 py-3 font-medium",
                      trade.pnl && parseFloat(String(trade.pnl)) >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {trade.pnl ? `${parseFloat(String(trade.pnl)) >= 0 ? '+' : ''}$${parseFloat(String(trade.pnl)).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Manual
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(trade) }}
                          className="p-1.5 hover:bg-[var(--background-tertiary)] rounded transition-colors"
                          title="Edit trade"
                        >
                          <svg className="w-4 h-4 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingTrade(trade) }}
                          className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                          title="Delete trade"
                        >
                          <Trash2 size={16} className="text-[var(--foreground-muted)] hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {trades.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground-muted)]">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalTrades)} of {totalTrades} trades
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page * limit >= totalTrades}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Trade Form Modal */}
      <TradeForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingTrade(null)
        }}
        onSubmit={(formData) => saveTradeMutation.mutate(formData)}
        trade={editingTrade}
        strategies={strategies}
        tags={tags}
        loading={saveTradeMutation.isPending}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTrade}
        onClose={() => setDeletingTrade(null)}
        title="Delete Trade"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[var(--foreground-muted)]">
            Are you sure you want to delete this trade? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeletingTrade(null)}
              disabled={deleteTradeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteTradeMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      {/* History Sync Modal */}
      <HistorySyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  )
}
