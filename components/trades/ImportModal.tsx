'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle,
  XCircle, FileText, ChevronRight, RotateCcw, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (results: any) => void
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'result'

const REQUIRED_FIELDS = ['symbol', 'type', 'entryPrice', 'entryDate', 'quantity']
const ALL_FIELDS = [
  { key: 'symbol', label: 'Symbol', required: true, hint: 'e.g. XAUUSD' },
  { key: 'type', label: 'Type', required: true, hint: 'BUY or SELL' },
  { key: 'entryPrice', label: 'Entry Price', required: true, hint: 'e.g. 2300.50' },
  { key: 'exitPrice', label: 'Exit Price', required: false, hint: 'Blank if open' },
  { key: 'quantity', label: 'Lots', required: true, hint: 'e.g. 0.10' },
  { key: 'entryDate', label: 'Open Time', required: true, hint: '2024-01-15 10:30' },
  { key: 'exitDate', label: 'Close Time', required: false, hint: 'Blank if open' },
  { key: 'partialCloses', label: 'Partial Closes', required: false, hint: '0.05@2310;0.05@2320' },
]

const AUTO_DETECT: Record<string, string[]> = {
  symbol: ['Symbol', 'symbol', 'Pair', 'Instrument'],
  type: ['Type', 'type', 'Direction', 'Side'],
  entryPrice: ['Entry Price', 'EntryPrice', 'Entry', 'Open Price'],
  exitPrice: ['Exit Price', 'ExitPrice', 'Exit', 'Close Price'],
  quantity: ['Lots', 'Quantity', 'Size', 'Volume', 'Amount'],
  entryDate: ['Open Time', 'Entry Date', 'EntryDate', 'Open Date', 'Date'],
  exitDate: ['Close Time', 'Exit Date', 'ExitDate', 'Close Date'],
  partialCloses: ['Partial Closes', 'PartialCloses', 'Partials'],
}

function detectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const [field, aliases] of Object.entries(AUTO_DETECT)) {
    for (const header of headers) {
      if (aliases.some(a => a.toLowerCase() === header.toLowerCase())) {
        mapping[field] = header
        break
      }
    }
  }
  return mapping
}

// Partial Closes format: qty@price;qty@price   e.g.  0.05@2310.00;0.05@2320.50
const SAMPLE_CSV = `Symbol,Type,Entry Price,Exit Price,Lots,Open Time,Close Time,Partial Closes
XAUUSD,BUY,2300.50,2325.00,0.10,2024-03-01 09:30,2024-03-01 14:45,
EURUSD,SELL,1.0850,1.0790,0.20,2024-03-02 10:00,2024-03-02 16:30,
GBPUSD,BUY,1.2640,,0.10,2024-03-04 08:15,,0.05@1.2680;0.05@1.2700
XAUUSD,SELL,2350.00,,0.05,2024-03-05 11:00,,
`

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [previewTrades, setPreviewTrades] = useState<any[]>([])
  const [importResult, setImportResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setDragging(false)
    setFile(null)
    setHeaders([])
    setMapping({})
    setPreviewTrades([])
    setImportResult(null)
    setLoading(false)
    setError(null)
  }

  const handleClose = () => { reset(); onClose() }

  const processFile = useCallback((f: File) => {
    setError(null)
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setError('File must have a header row and at least one data row.'); return }
      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setHeaders(csvHeaders)
      setMapping(detectMapping(csvHeaders))
      setStep('mapping')
    }
    reader.readAsText(f)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) processFile(f)
    else setError('Please drop a valid .csv file')
  }, [processFile])

  const handlePreviewAndImport = async (previewOnly: boolean) => {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('format', 'csv')
      form.append('mapping', JSON.stringify(mapping))
      if (previewOnly) form.append('preview', 'true')

      const res = await fetch('/api/trades/import', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Import failed')

      if (previewOnly) {
        setPreviewTrades(data.trades || [])
        setStep('preview')
      } else {
        setImportResult(data)
        setStep('result')
        onImport(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    setError(null)
    try {
      const res = await fetch('/api/trades/recalculate-pnl', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Recalculation failed')
      setImportResult({
        success: true,
        imported: data.updated,
        total: data.updated + data.failed,
        failed: data.failed,
        errors: data.errors,
      })
      setStep('result')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRecalculating(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tradelog_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const missingRequired = REQUIRED_FIELDS.filter(f => !mapping[f])
  const mappedCount = Object.values(mapping).filter(Boolean).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="lg"
      className="bg-[var(--card-bg)] border-[var(--border)]"
    >
      <div className="p-1 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <FileSpreadsheet size={15} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Import Trades</h2>
              <p className="text-[10px] text-[var(--foreground-muted)]">Upload a CSV file to bulk-import your trades</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium">
            {(['upload', 'mapping', 'preview'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span className={cn(
                  'px-2 py-0.5 rounded-full border transition-all',
                  step === s ? 'bg-blue-600 text-white border-blue-600' :
                    (['upload', 'mapping', 'preview'] as string[]).indexOf(step) > i || step === 'result' || step === 'importing'
                      ? 'bg-[var(--profit)]/10 text-[var(--profit)] border-[var(--profit)]/30'
                      : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border-[var(--border)]'
                )}>
                  {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {i < 2 && <ChevronRight size={10} className="text-[var(--foreground-disabled)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 select-none',
                dragging
                  ? 'border-blue-500 bg-blue-500/8 scale-[1.01]'
                  : 'border-[var(--border)] hover:border-blue-500/50 hover:bg-blue-500/4'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                aria-label="Upload CSV file"
                title="Upload CSV file"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <div className={cn(
                'w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all',
                dragging ? 'bg-blue-600/20' : 'bg-[var(--background-tertiary)]'
              )}>
                <Upload size={26} className={dragging ? 'text-blue-400' : 'text-[var(--foreground-muted)]'} />
              </div>
              <p className="font-semibold text-[var(--foreground)] mb-1">
                {dragging ? 'Drop it!' : 'Drag & drop your CSV'}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">or click to browse — only .csv files</p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--foreground-disabled)] uppercase">Need a template?</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadTemplate}
                className="flex-1 flex items-center justify-center gap-2.5 py-2.5 border border-[var(--border)] hover:border-blue-500/40 hover:bg-blue-500/5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] hover:text-blue-400 transition-all"
              >
                <Download size={15} />
                Download sample CSV
              </button>

              <button
                disabled={recalculating}
                onClick={handleRecalculate}
                className="flex-1 flex items-center justify-center gap-2.5 py-2.5 border border-[var(--border)] hover:border-blue-500/40 hover:bg-blue-500/5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] hover:text-blue-400 transition-all"
              >
                {recalculating ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                Recalculate Past Imports
              </button>
            </div>

            {/* Format reference */}
            <div className="p-3 bg-[var(--background-tertiary)] rounded-lg">
              <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">Required columns</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_FIELDS.map(f => (
                  <span key={f.key} className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                    f.required
                      ? 'bg-blue-600/10 text-blue-400 border-blue-600/20'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border-[var(--border)]'
                  )}>
                    {f.label}{f.required ? ' *' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Mapping ── */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">
                <span className="font-semibold text-[var(--foreground)]">{headers.length}</span> columns detected in{' '}
                <span className="font-semibold text-blue-400">{file?.name}</span>
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--profit)]/10 text-[var(--profit)] border border-[var(--profit)]/20 font-medium">
                {mappedCount} / {ALL_FIELDS.length} mapped
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ALL_FIELDS.map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    title={`Map column for ${field.label}`}
                    aria-label={`Map column for ${field.label}`}
                    onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value || '' }))}
                    className={cn(
                      'w-full h-8 px-2 text-xs rounded-lg border bg-[var(--input-bg)] text-[var(--foreground)]',
                      'focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all',
                      field.required && !mapping[field.key]
                        ? 'border-red-500/60'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    <option value="">— skip —</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {missingRequired.length > 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={13} />
                Map required fields: {missingRequired.map(f => ALL_FIELDS.find(x => x.key === f)?.label).join(', ')}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <button onClick={() => setStep('upload')} className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                ← Back
              </button>
              <Button
                disabled={missingRequired.length > 0 || loading}
                onClick={() => handlePreviewAndImport(true)}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Preview Import →'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--foreground-muted)]">
              Previewing <span className="font-semibold text-[var(--foreground)]">{previewTrades.length}</span> trades. Everything look right?
            </p>

            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--background-tertiary)] border-b border-[var(--border)]">
                  <tr>
                    {['Symbol', 'Type', 'Entry Price', 'Exit Price', 'Lots', 'Status', 'Partial Closes'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-bold text-[var(--foreground-muted)] uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewTrades.map((t, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background-tertiary)]/50">
                      <td className="px-3 py-2 font-semibold text-[var(--foreground)]">{t.symbol}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          t.type === 'BUY' ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'
                        )}>{t.type}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[var(--foreground-muted)]">{t.entryPrice}</td>
                      <td className="px-3 py-2 font-mono text-[var(--foreground-muted)]">{t.exitPrice || '—'}</td>
                      <td className="px-3 py-2 font-mono text-[var(--foreground-muted)]">{t.quantity}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          t.status === 'CLOSED' ? 'bg-[var(--profit)]/10 text-[var(--profit)]' : 'bg-amber-500/10 text-amber-400'
                        )}>{t.status}</span>
                      </td>
                      <td className="px-3 py-2 text-[var(--foreground-muted)] text-[10px] font-mono">
                        {t.partialClosesRaw
                          ? t.partialClosesRaw.split(';').filter(Boolean).map((pc: string, pi: number) => (
                            <span key={pi} className="block">{pc.trim()}</span>
                          ))
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <button onClick={() => setStep('mapping')} className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                ← Back
              </button>
              <Button
                isLoading={loading}
                onClick={() => handlePreviewAndImport(false)}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Import All Trades ✓
              </Button>
            </div>
          </div>
        )}

        {/* ── Importing spinner ── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
              <FileSpreadsheet size={20} className="absolute inset-0 m-auto text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">Importing trades…</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Please wait, this may take a moment</p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Result ── */}
        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[var(--profit)]/8 border border-[var(--profit)]/20 text-center">
                <CheckCircle size={20} className="mx-auto text-[var(--profit)] mb-1.5" />
                <p className="text-xl font-bold text-[var(--profit)]">{importResult.imported}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] font-medium uppercase tracking-wider">Imported</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-center">
                <FileSpreadsheet size={20} className="mx-auto text-[var(--foreground-muted)] mb-1.5" />
                <p className="text-xl font-bold text-[var(--foreground)]">{importResult.total}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] font-medium uppercase tracking-wider">Total</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-center">
                <XCircle size={20} className="mx-auto text-red-400 mb-1.5" />
                <p className="text-xl font-bold text-red-400">{importResult.failed}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] font-medium uppercase tracking-wider">Failed</p>
              </div>
            </div>

            {importResult.errors?.length > 0 && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-[var(--background-tertiary)] border-b border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Row Errors</p>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-[var(--border)]">
                  {importResult.errors.map((err: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                      <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                      <span><span className="font-semibold text-[var(--foreground)]">Row {err.row}:</span>{' '}
                        <span className="text-[var(--foreground-muted)]">{err.message}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                <RotateCcw size={12} /> Import another file
              </button>
              <Button
                onClick={handleClose}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Done — View Trades
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
