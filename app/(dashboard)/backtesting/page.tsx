'use client'

import { useState } from 'react'
import { useReplayEngine } from '@/lib/backtesting/useReplayEngine'
import { ReplaySetup } from '@/components/backtesting/ReplaySetup'
import { ReplayTopBar } from '@/components/backtesting/ReplayTopBar'
import { ReplayChart } from '@/components/backtesting/ReplayChart'
import { PlaybackControls } from '@/components/backtesting/PlaybackControls'
import { OrderPanel } from '@/components/backtesting/OrderPanel'
import { OpenPositions } from '@/components/backtesting/OpenPositions'
import { SessionStats } from '@/components/backtesting/SessionStats'
import { SessionSummary } from '@/components/backtesting/SessionSummary'
import { ReplayConfig, Timeframe } from '@/lib/backtesting/types'
import { SpeedOption } from '@/lib/backtesting/useReplayEngine'
import { api } from '@/lib/apiClient'
import toast from 'react-hot-toast'

export default function BacktestingPage() {
    const engine = useReplayEngine()
    const [showSummary, setShowSummary] = useState(false)

    const handleStart = (cfg: ReplayConfig) => engine.loadSession(cfg, true)

    const handleTimeframeChange = async (tf: Timeframe) => {
        if (!engine.config) return
        toast('Switching to ' + tf.toUpperCase() + '…', { icon: '⏳' })
        await engine.loadSession({ ...engine.config, timeframe: tf }, false)
        if (engine.error) toast.error(engine.error)
    }

    const handleSpeedChange = (s: number) => engine.setSpeed(s as SpeedOption)

    const handleEndSession = () => {
        engine.pause()
        setShowSummary(true)
    }

    const handleNewSession = () => {
        setShowSummary(false)
        window.location.reload()
    }

    const handleSaveToJournal = async () => {
        if (engine.closedTrades.length === 0) { toast.error('No trades to save.'); return }
        try {
            const trades = engine.closedTrades.map(t => ({
                symbol: engine.config?.displaySymbol ?? engine.config?.symbol ?? 'UNKNOWN',
                direction: t.direction,
                entryDate: new Date(t.entryTime * 1000).toISOString(),
                exitDate: new Date(t.exitTime * 1000).toISOString(),
                entryPrice: t.entryPrice,
                exitPrice: t.exitPrice,
                lotSize: t.lots,
                pnl: t.pnl,
                notes: `[Replay] Exit: ${t.exitReason}`,
                tags: ['replay', 'backtesting'],
            }))
            
            await api.trades.bulkImport({ trades })
            toast.success(`${trades.length} trades saved to your journal!`)
        } catch (err) {
            console.error('Failed to save replay trades:', err)
            toast.error('Failed to save to journal.')
        }
    }

    // ── Setup ────────────────────────────────────────────────────────────────────
    if (engine.status === 'setup') {
        return (
            <div className="h-[calc(100vh-64px)] bg-[var(--background)] overflow-y-auto">
                <ReplaySetup onStart={handleStart} isLoading={false} />
            </div>
        )
    }

    // ── Loading ──────────────────────────────────────────────────────────────────
    if (engine.status === 'loading') {
        return (
            <div className="h-[calc(100vh-64px)] bg-[var(--background)] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                    </div>
                    <div className="absolute -inset-2 rounded-3xl border-2 border-blue-500/10 animate-ping" />
                </div>
                <div className="text-center">
                    <div className="text-sm font-semibold text-[var(--foreground)]">Loading Historical Data</div>
                    <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        {engine.config?.displaySymbol} · {engine.config?.timeframe.toUpperCase()}
                    </div>
                </div>
                {engine.error && (
                    <div className="max-w-sm text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                        {engine.error}
                    </div>
                )}
            </div>
        )
    }

    // ── Replay Terminal ──────────────────────────────────────────────────────────
    return (
        <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[var(--background)]">
            {/* Top bar — symbol, balance, status only (timeframe + speed moved to pill) */}
            {engine.config && (
                <ReplayTopBar
                    config={engine.config}
                    status={engine.status}
                    runningBalance={engine.runningBalance}
                    currentTimeframe={engine.config.timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    onSpeedChange={handleSpeedChange}
                    onNewSession={handleNewSession}
                />
            )}

            {/* Main layout */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Chart + floating controls */}
                <div className="relative flex-1 overflow-hidden">
                    <ReplayChart
                        bars={engine.visibleBars}
                        currentBar={engine.currentBar}
                        openPositions={engine.openPositions}
                        closedTrades={engine.closedTrades}
                        symbol={engine.config?.symbol ?? ''}
                        timeframe={engine.config?.timeframe ?? '1d'}
                        status={engine.status}
                        onChartClick={engine.setStartBar}
                    />

                    {/* Interactive 'Select Mode' floating banner */}
                    {engine.status === 'select' && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-blue-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl animate-fade-in z-20 pointer-events-none">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-sm font-semibold tracking-wide">Click any historical candle to set replay start point</span>
                        </div>
                    )}

                    {/* Floating TradingView-style pill toolbar */}
                    {engine.config && engine.status !== 'select' && (
                        <PlaybackControls
                            status={engine.status}
                            currentIndex={engine.currentIndex}
                            totalBars={engine.totalBars}
                            speed={engine.speed}
                            timeframe={engine.config.timeframe}
                            onToggle={engine.togglePlay}
                            onStepForward={engine.stepForward}
                            onJumpToEnd={engine.jumpToEnd}
                            onSpeedChange={handleSpeedChange}
                            onTimeframeChange={handleTimeframeChange}
                            onEndSession={handleEndSession}
                            onEnterSelectMode={engine.enterSelectMode}
                        />
                    )}
                </div>

                {/* Right panel */}
                <div className="w-64 xl:w-72 flex-shrink-0 border-l border-[var(--border)] bg-[var(--background-secondary)] flex flex-col overflow-hidden relative">
                    {/* Glass overlay if in select mode */}
                    {engine.status === 'select' && (
                        <div className="absolute inset-0 bg-[var(--background-secondary)]/80 backdrop-blur-[2px] z-50 flex items-center justify-center p-6 text-center">
                            <div className="text-sm font-semibold text-[var(--foreground-muted)]">Select a start point on the chart to enable trading.</div>
                        </div>
                    )}

                    {engine.config && (
                        <OrderPanel
                            config={engine.config}
                            currentBar={engine.currentBar}
                            openPositions={engine.openPositions}
                            onPlaceTrade={engine.placeTrade}
                        />
                    )}
                    <OpenPositions
                        positions={engine.openPositions}
                        onClose={engine.closePosition}
                    />
                </div>
            </div>

            {/* Slim session stats bar */}
            <SessionStats
                metrics={engine.sessionMetrics}
                symbol={engine.config?.displaySymbol ?? ''}
                onEndSession={handleEndSession}
            />

            {/* Session summary modal */}
            {engine.config && (
                <SessionSummary
                    isOpen={showSummary}
                    metrics={engine.sessionMetrics}
                    trades={engine.closedTrades}
                    config={engine.config}
                    onClose={() => setShowSummary(false)}
                    onNewSession={handleNewSession}
                    onSaveToJournal={handleSaveToJournal}
                />
            )}
        </div>
    )
}
