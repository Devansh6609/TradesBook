'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { TradeTable } from '@/components/trades/TradeTable'
import { TradeFilters, TradeFiltersState } from '@/components/trades/TradeFilters'
import { TradeForm } from '@/components/trades/TradeForm'
import { ImportModal } from '@/components/trades/ImportModal'
import { Trade } from '@/types'
import { Plus, Filter, Link2, AlertCircle, Trash2, Download, Upload, TrendingUp, History, RefreshCw } from 'lucide-react'
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#050505] relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Section with Glassmorphism */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl relative border border-white/10 group-hover:scale-105 transition-transform">
                <History size={24} className="group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                Terminal_History
              </h1>
              <p className="text-[10px] font-bold text-foreground-disabled/60 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Monitoring active trade vectors — Live Telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-foreground-disabled uppercase tracking-widest leading-none">Total_Nodes</span>
                <span className="text-sm font-black text-white font-mono">{totalTrades}</span>
              </div>
              <div className="w-px h-6 bg-white/5 mx-2" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest leading-none">Active_Flow</span>
                <span className="text-sm font-black text-green-400 font-mono">LIVE</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
              >
                <RefreshCw size={14} className="text-blue-400" />
                Sync History
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
              >
                <Upload size={14} className="text-blue-400" />
                Import CSV
              </button>
              <button
                onClick={() => {
                  setEditingTrade(null)
                  setIsFormOpen(true)
                }}
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 border border-blue-400/20"
              >
                <Plus size={14} strokeWidth={3} />
                New Position
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Toolbar & Filter Badge */}
          <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Data stream</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase tracking-tight">Active Vectors</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-black text-foreground-disabled">
                      {totalTrades}
                    </span>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-white/5" />

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest",
                      showFilters
                        ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                        : "bg-white/5 border-white/10 text-foreground-disabled hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Filter size={14} />
                    Filter Matrix
                    {showFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse ml-1" />}
                  </button>

                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-foreground-disabled hover:text-white hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    <Download size={14} />
                    Export Data
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black text-foreground-disabled uppercase tracking-widest">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                Buffer Synchronized
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="p-8 border-b border-white/5 bg-white/[0.01] animate-in fade-in slide-in-from-top-4 duration-500">
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
      </main>

      {/* Floating Bulk Actions Bar */}
      {selectedTrades.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-700 ease-out">
          <div className="bg-black/80 backdrop-blur-3xl border border-white/10 px-8 py-4 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] flex items-center gap-8 ring-1 ring-white/10">
            <div className="flex items-center gap-4 pr-8 border-r border-white/10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-40 animate-pulse" />
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm relative border border-white/20">
                  {selectedTrades.length}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Vectors Isolated</span>
                <span className="text-[8px] font-bold text-foreground-disabled uppercase tracking-widest mt-0.5">Ready for batch process</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 text-[10px] font-black text-white hover:text-blue-400 uppercase tracking-[0.2em] transition-colors group"
              >
                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                Bulk_Export
              </button>
              <button
                onClick={() => {
                  toast.error("Bulk Delete sequence pending implementation")
                }}
                className="flex items-center gap-2 text-[10px] font-black text-red-500 opacity-80 hover:opacity-100 uppercase tracking-[0.2em] transition-opacity group"
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                Purge_All
              </button>
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button
                onClick={() => setSelectedTrades([])}
                className="text-[10px] font-black text-foreground-disabled hover:text-white uppercase tracking-[0.2em] transition-colors"
              >
                Cancel_Ops
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals with Glassmorphism Layering Handled in Components */}
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

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportSuccess}
      />

      <Modal
        isOpen={!!deletingTrade}
        onClose={() => setDeletingTrade(null)}
        title="Vector_Purge_Confirmation"
        size="sm"
      >
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-4">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Permanent Deletion Warning</p>
                    <p className="text-[10px] font-medium text-foreground-disabled uppercase leading-relaxed">
                        Purging vector <span className="text-white font-mono">{deletingTrade?.symbol}</span> will permanently remove all telemetry and journal data from the local buffer.
                    </p>
                </div>
            </div>
            
            <div className="flex justify-end gap-3">
                <Button
                    variant="ghost"
                    className="text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/5"
                    onClick={() => setDeletingTrade(null)}
                >
                    Abort_Process
                </Button>
                <Button
                    className="bg-red-600 hover:bg-red-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                    onClick={confirmDelete}
                    isLoading={deleteTradeMutation.isPending}
                >
                    Confirm_Purge
                </Button>
            </div>
        </div>
      </Modal>

      <HistorySyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  )
}
