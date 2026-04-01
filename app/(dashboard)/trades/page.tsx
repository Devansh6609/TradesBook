'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { TradeTable } from '@/components/trades/TradeTable'
import { TradeFilters, TradeFiltersState } from '@/components/trades/TradeFilters'
import { TradeForm } from '@/components/trades/TradeForm'
import { ImportModal } from '@/components/trades/ImportModal'
import { Trade } from '@/types'
import { Plus, Filter, Link2, AlertCircle, Trash2, Download, Upload, TrendingUp, History, Target } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { HistorySyncModal } from '@/components/trades/HistorySyncModal'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { TradeSummaryCard } from '@/components/trades/TradeSummaryCard'
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
    totalPnl: number
    totalNetPnl: number
    avgPips: number
    dailyProfit: number
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
      toast.error('Failed to save trade: ' + (error instanceof Error ? error.message : 'Internal server error'))
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

  const handleShare = (trade: Trade) => {
    navigator.clipboard.writeText(`${window.location.origin}/trades/${trade.id}`)
    toast.success('Trade link copied to clipboard!')
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
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto px-4 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Trades</h1>
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-black text-foreground-disabled transform translate-y-1">
              {totalTrades}
            </span>
          </div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 text-[13px] text-foreground-disabled font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
            Not connected
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-[13px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Link2 size={16} />
            Connect MT4/MT5
          </button>
          
          <button
            onClick={() => {
              setFilters({
                symbol: '',
                type: '',
                status: '',
                strategyId: '',
                dateFrom: null,
                dateTo: null,
                minPnl: '',
                maxPnl: '',
              })
              toast.success('Filters cleared')
            }}
            className="px-4 py-2 rounded-lg bg-[#111111] border border-white/5 text-foreground-muted hover:text-white text-[13px] font-bold transition-all flex items-center gap-2"
          >
            <Trash2 size={16} />
            Clear All
          </button>

          <button
            onClick={() => {
              setEditingTrade(null)
              setIsFormOpen(true)
            }}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 text-[13px] font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Trade
          </button>
        </div>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TradeSummaryCard
          label="Total Trades"
          value={stats?.totalTrades || 0}
          icon={TrendingUp}
          trend={{ value: "0%", isPositive: true }}
        />
        <TradeSummaryCard
          label="Avg Pips"
          value={stats?.avgPips ? stats.avgPips.toFixed(2) : "0.00"}
          icon={Target}
        />
        <TradeSummaryCard
          label="Win Rate"
          value={`${stats?.winRate ? stats.winRate.toFixed(0) : "0"}%`}
          icon={History}
        />
        <TradeSummaryCard
          label="Daily Profit"
          value={`$${stats?.dailyProfit ? stats.dailyProfit.toFixed(2) : "0.00"}`}
          icon={TrendingUp}
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Trade History</h2>
            <span className="text-xs text-foreground-disabled font-semibold">1 of {totalTrades} trades</span>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-bold transition-all flex items-center gap-2",
              showFilters 
                ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                : "bg-[#111111] border-white/5 text-foreground-muted hover:text-white"
            )}
          >
            <Filter size={16} />
            Filters
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
            <TradeFilters
              filters={filters}
              onChange={setFilters}
              strategies={strategies}
              stats={stats}
            />
          </div>
        )}

        {/* Trade Table */}
        <div className="overflow-hidden">
          <TradeTable
            trades={trades}
            loading={isLoading}
            totalCount={totalTrades}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            selectedTrades={selectedTrades}
            onSelectTrade={handleSelectTrade}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedTrades.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-black/80 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                {selectedTrades.length}
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Vectors Selected</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 text-[10px] font-black text-foreground-disabled hover:text-white uppercase tracking-widest transition-colors"
                title="Export Selected"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={() => {
                  // Actually implement bulk delete if needed, for now just show modal for one
                  toast.error("Bulk Delete sequence pending implementation")
                }}
                className="flex items-center gap-2 text-[10px] font-black text-loss opacity-80 hover:opacity-100 uppercase tracking-widest transition-opacity"
              >
                <Trash2 size={14} />
                Purge_All
              </button>
              <button
                onClick={() => setSelectedTrades([])}
                className="ml-2 text-[10px] font-black text-foreground-disabled hover:text-white uppercase tracking-widest opacity-40 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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
