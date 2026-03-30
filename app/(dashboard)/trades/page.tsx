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
    <div className="space-y-8 pb-10">
      {/* Header Section with Glassmorphism */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 blur-3xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-black/20 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Terminal_History</h1>
            </div>
            <p className="text-[11px] font-bold text-foreground-disabled/60 uppercase tracking-[0.4em] flex items-center gap-2 pl-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              MT4/MT5 Node Offline — Manual Entry Mode Active
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>setIsSyncModalOpen(true)}
              className="group relative px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <div className="flex items-center gap-2 relative z-10">
                <History size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                Sync History
              </div>
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
            >
              <Upload size={14} />
              Import CSV
            </button>

            <button
              onClick={() => {
                setEditingTrade(null)
                setIsFormOpen(true)
              }}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95 transition-all flex items-center gap-2 border border-blue-400/20"
            >
              <Plus size={14} strokeWidth={3} />
              New Position
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative group/content">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-blue-500/[0.01] blur-3xl rounded-[2rem] -z-10" />

        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Data stream</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white uppercase tracking-tight">Active Vectors</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-black text-foreground-disabled">
                    {totalTrades}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-2 rounded-lg border transition-all active:scale-95",
                  showFilters
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                    : "bg-white/5 border-white/10 text-foreground-disabled hover:text-white hover:bg-white/10"
                )}
                title="Filter Matrix"
              >
                <Filter size={18} />
              </button>
              
              <div className="h-4 w-px bg-white/10 mx-1" />

              <button
                onClick={handleExport}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-foreground-disabled hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title="Export Data"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="p-6 border-b border-white/5 bg-white/[0.01] animate-in fade-in slide-in-from-top-2 duration-300">
              <TradeFilters
                filters={filters}
                onChange={setFilters}
                strategies={strategies}
              />
            </div>
          )}

          {/* Trade Matrix (Table) */}
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
