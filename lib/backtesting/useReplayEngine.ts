"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  OHLCVBar,
  OpenPosition,
  SimulatedTrade,
  ReplayConfig,
  ReplayStatus,
  SessionMetrics,
  EquityPoint,
  SYMBOL_OPTIONS,
  TIMEFRAME_OPTIONS,
} from "./types";

// ── TradingView-matching speeds (ms per bar) ───────────────────────────────────
const SPEED_MS: Record<number, number> = {
  0.1: 10000,
  0.25: 4000,
  0.5: 2000,
  1: 1000,
  2: 500,
  3: 333,
  5: 200,
  10: 100,
};

export const SPEED_OPTIONS = [0.1, 0.25, 0.5, 1, 2, 3, 5, 10] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatDurationBars(bars: number, barDurationSec: number): string {
  const totalSec = bars * barDurationSec;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

function computeSessionMetrics(
  trades: SimulatedTrade[],
  initialCapital: number,
): SessionMetrics {
  if (trades.length === 0) {
    return {
      netPnl: 0,
      netPnlPct: 0,
      winRate: 0,
      maxDrawdown: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      equityCurve: [],
    };
  }
  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl <= 0);
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossProfit = winners.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
  const equityCurve: EquityPoint[] = [];
  let equity = initialCapital;
  let peak = initialCapital;
  let maxDD = 0;
  for (const t of trades) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = ((peak - equity) / peak) * 100;
    if (dd > maxDD) maxDD = dd;
    equityCurve.push({ time: t.exitTime, value: equity });
  }
  return {
    netPnl,
    netPnlPct: (netPnl / initialCapital) * 100,
    winRate: (winners.length / trades.length) * 100,
    maxDrawdown: maxDD,
    totalTrades: trades.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    profitFactor:
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0,
    avgWin: winners.length > 0 ? grossProfit / winners.length : 0,
    avgLoss: losers.length > 0 ? grossLoss / losers.length : 0,
    largestWin: winners.length > 0 ? Math.max(...winners.map((t) => t.pnl)) : 0,
    largestLoss:
      losers.length > 0 ? Math.abs(Math.min(...losers.map((t) => t.pnl))) : 0,
    equityCurve,
  };
}

function calcFloatingPnl(
  pos: OpenPosition,
  bar: OHLCVBar,
  pipValue: number,
  pipSize: number,
): number {
  const priceDiff =
    pos.direction === "LONG"
      ? bar.close - pos.entryPrice
      : pos.entryPrice - bar.close;
  return (priceDiff / pipSize) * pipValue * pos.lots * 100;
}

export function useReplayEngine() {
  //───── State ──────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<ReplayConfig | null>(null);
  const [status, setStatus] = useState<ReplayStatus>("setup");
  const [error, setError] = useState<string | null>(null);
  const [allBars, setAllBars] = useState<OHLCVBar[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [closedTrades, setClosedTrades] = useState<SimulatedTrade[]>([]);
  const [speed, setSpeedState] = useState<SpeedOption>(1);

  //───── Refs (avoid stale closures in setInterval) ────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);
  const stateRef = useRef({
    currentIndex: 0,
    allBars: [] as OHLCVBar[],
    openPositions: [] as OpenPosition[],
    closedTrades: [] as SimulatedTrade[],
    config: null as ReplayConfig | null,
  });

  useEffect(() => {
    stateRef.current.currentIndex = currentIndex;
    stateRef.current.allBars = allBars;
    stateRef.current.openPositions = openPositions;
    stateRef.current.closedTrades = closedTrades;
    stateRef.current.config = config;
  }, [currentIndex, allBars, openPositions, closedTrades, config]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  //───── Load historical data ───────────────────────────────────────────────────
  const loadSession = useCallback(
    async (cfg: ReplayConfig, fromSetup = true) => {
      setStatus("loading");
      setError(null);
      setConfig(cfg);
      if (fromSetup) {
        setOpenPositions([]);
        setClosedTrades([]);
      }

      const tf = TIMEFRAME_OPTIONS.find((t) => t.value === cfg.timeframe);
      if (!tf) {
        setError("Unknown timeframe");
        setStatus(fromSetup ? "setup" : "paused");
        return;
      }

      // Respect Yahoo Finance date range limits per interval
      const startMs = new Date(cfg.startDate).getTime();
      let rangeMs = 365 * 24 * 3600 * 1000;
      if (tf.yahooInterval === "1m") rangeMs = 7 * 24 * 3600 * 1000;
      else if (tf.yahooInterval === "5m" || tf.yahooInterval === "15m")
        rangeMs = 60 * 24 * 3600 * 1000;
      else if (tf.yahooInterval === "1h") rangeMs = 730 * 24 * 3600 * 1000;
      const endDate = new Date(startMs + rangeMs).toISOString().slice(0, 10);

      try {
        const res = await fetch(
          `/api/backtesting/historical-data?symbol=${encodeURIComponent(cfg.symbol)}&from=${cfg.startDate}&to=${endDate}&interval=${tf.yahooInterval}`,
        );
        const data = await res.json();

        if (!res.ok || !data.bars || data.bars.length < 10) {
          const hint =
            tf.yahooInterval === "1m"
              ? "Try a start date within the last 7 days."
              : tf.yahooInterval === "5m" || tf.yahooInterval === "15m"
                ? "Try a start date within the last 60 days."
                : "Try a different date or symbol.";
          throw new Error(
            data.error ||
              `Not enough data for ${cfg.displaySymbol} on ${cfg.timeframe.toUpperCase()}. ${hint}`,
          );
        }

        setAllBars(data.bars);
        // Start by showing the whole chart for selection mode
        setCurrentIndex(data.bars.length - 1);
        setStatus("select");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
        setStatus(fromSetup ? "setup" : "paused");
      }
    },
    [],
  );

  //───── Core advance one bar ───────────────────────────────────────────────────
  const advanceBar = useCallback(() => {
    const {
      currentIndex: idx,
      allBars: bars,
      openPositions: positions,
      closedTrades: trades,
      config: cfg,
    } = stateRef.current;

    if (idx >= bars.length - 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      isPlayingRef.current = false;
      setStatus("ended");
      return;
    }

    const nextIdx = idx + 1;
    const bar = bars[nextIdx];
    const sym = SYMBOL_OPTIONS.find((s) => s.value === cfg?.symbol);
    const pipValue = sym?.pipValue ?? 1;
    const pipSize = sym?.pipSize ?? 0.0001;

    const stillOpen: OpenPosition[] = [];
    const newlyClosed: SimulatedTrade[] = [];

    for (const pos of positions) {
      let exitPrice: number | null = null;
      let exitReason: SimulatedTrade["exitReason"] = "manual";

      if (pos.direction === "LONG") {
        if (pos.slPrice !== null && bar.low <= pos.slPrice) {
          exitPrice = pos.slPrice;
          exitReason = "sl";
        } else if (pos.tpPrice !== null && bar.high >= pos.tpPrice) {
          exitPrice = pos.tpPrice;
          exitReason = "tp";
        }
      } else {
        if (pos.slPrice !== null && bar.high >= pos.slPrice) {
          exitPrice = pos.slPrice;
          exitReason = "sl";
        } else if (pos.tpPrice !== null && bar.low <= pos.tpPrice) {
          exitPrice = pos.tpPrice;
          exitReason = "tp";
        }
      }

      if (exitPrice !== null) {
        const priceDiff =
          pos.direction === "LONG"
            ? exitPrice - pos.entryPrice
            : pos.entryPrice - exitPrice;
        const pips = priceDiff / pipSize;
        const pnl = pips * pipValue * pos.lots * 100;
        const barDur =
          TIMEFRAME_OPTIONS.find((t) => t.value === cfg?.timeframe)
            ?.barDurationSec ?? 3600;
        const durationBars =
          nextIdx - bars.findIndex((b) => b.time === pos.entryTime);
        newlyClosed.push({
          id: pos.id,
          direction: pos.direction,
          entryTime: pos.entryTime,
          exitTime: bar.time,
          entryPrice: pos.entryPrice,
          exitPrice,
          lots: pos.lots,
          pnl,
          pnlPct: (pnl / (cfg?.initialCapital ?? 10000)) * 100,
          exitReason,
          durationBars,
          durationLabel: formatDurationBars(durationBars, barDur),
        });
      } else {
        stillOpen.push({
          ...pos,
          floatingPnl: calcFloatingPnl(pos, bar, pipValue, pipSize),
        });
      }
    }

    setCurrentIndex(nextIdx);
    if (newlyClosed.length > 0) {
      setOpenPositions(stillOpen);
      setClosedTrades((prev) => [...prev, ...newlyClosed]);
    } else {
      setOpenPositions(stillOpen);
    }
  }, []);

  //───── Playback controls ──────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    isPlayingRef.current = false;
    setStatus((prev) => (prev === "playing" ? "paused" : prev));
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    if (!stateRef.current.config) return;
    isPlayingRef.current = true;
    setStatus("playing");
    const ms = SPEED_MS[stateRef.current.config.speed ?? 1] ?? 1000;
    intervalRef.current = setInterval(advanceBar, ms);
  }, [advanceBar]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [play, pause]);

  const stepForward = useCallback(() => {
    pause();
    advanceBar();
  }, [pause, advanceBar]);
  const stepBack = useCallback(() => {
    pause();
    setCurrentIndex((prev) => Math.max(1, prev - 1));
  }, [pause]);

  // Jump to very end (like TradingView ⏭| button)
  const jumpToEnd = useCallback(() => {
    pause();
    setCurrentIndex(stateRef.current.allBars.length - 1);
  }, [pause]);

  //───── Speed change ───────────────────────────────────────────────────────────
  const setSpeed = useCallback(
    (s: SpeedOption) => {
      setSpeedState(s);
      setConfig((prev) => (prev ? { ...prev, speed: s } : prev));
      if (isPlayingRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(advanceBar, SPEED_MS[s] ?? 1000);
      }
    },
    [advanceBar],
  );

  //───── Trade actions ──────────────────────────────────────────────────────────
  const placeTrade = useCallback(
    (
      direction: "LONG" | "SHORT",
      lots: number,
      slPips: number | null,
      tpPips: number | null,
    ) => {
      const bar = stateRef.current.allBars[stateRef.current.currentIndex];
      if (!bar || !stateRef.current.config) return;
      const sym = SYMBOL_OPTIONS.find(
        (s) => s.value === stateRef.current.config!.symbol,
      );
      const pipSize = sym?.pipSize ?? 0.0001;
      const entry = bar.close;
      const slPrice =
        slPips !== null
          ? direction === "LONG"
            ? entry - slPips * pipSize
            : entry + slPips * pipSize
          : null;
      const tpPrice =
        tpPips !== null
          ? direction === "LONG"
            ? entry + tpPips * pipSize
            : entry - tpPips * pipSize
          : null;
      setOpenPositions((prev) => [
        ...prev,
        {
          id: generateId(),
          direction,
          entryTime: bar.time,
          entryPrice: entry,
          lots,
          slPrice,
          tpPrice,
          slPips,
          tpPips,
          floatingPnl: 0,
        },
      ]);
    },
    [],
  );

  const closePosition = useCallback((id: string) => {
    const { allBars: bars, currentIndex: idx, config: cfg } = stateRef.current;
    const bar = bars[idx];
    if (!bar || !cfg) return;
    const sym = SYMBOL_OPTIONS.find((s) => s.value === cfg.symbol);
    const pipSize = sym?.pipSize ?? 0.0001;
    const pipValue = sym?.pipValue ?? 1;
    setOpenPositions((prev) => {
      const pos = prev.find((p) => p.id === id);
      if (!pos) return prev;
      const priceDiff =
        pos.direction === "LONG"
          ? bar.close - pos.entryPrice
          : pos.entryPrice - bar.close;
      const pnl = (priceDiff / pipSize) * pipValue * pos.lots * 100;
      const barDur =
        TIMEFRAME_OPTIONS.find((t) => t.value === cfg.timeframe)
          ?.barDurationSec ?? 3600;
      const entryIdx = bars.findIndex((b) => b.time === pos.entryTime);
      const durationBars = idx - (entryIdx >= 0 ? entryIdx : idx);
      setClosedTrades((ct) => [
        ...ct,
        {
          id: pos.id,
          direction: pos.direction,
          entryTime: pos.entryTime,
          exitTime: bar.time,
          entryPrice: pos.entryPrice,
          exitPrice: bar.close,
          lots: pos.lots,
          pnl,
          pnlPct: (pnl / cfg.initialCapital) * 100,
          exitReason: "manual",
          durationBars,
          durationLabel: formatDurationBars(durationBars, barDur),
        },
      ]);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  //───── Select Mode ─────────────────────────────────────────────────────────────
  const setStartBar = useCallback((time: number) => {
    const idx = stateRef.current.allBars.findIndex((b) => b.time === time);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setStatus("paused");
    }
  }, []);

  const enterSelectMode = useCallback(() => {
    pause();
    setCurrentIndex(stateRef.current.allBars.length - 1);
    setStatus("select");
  }, [pause]);

  //───── Derived ───────────────────────────────────────────────────────────────
  const visibleBars =
    status === "select" ? allBars : allBars.slice(0, currentIndex + 1);
  const currentBar = visibleBars[visibleBars.length - 1] ?? null;
  const sessionMetrics = computeSessionMetrics(
    closedTrades,
    config?.initialCapital ?? 10000,
  );
  const runningBalance =
    (config?.initialCapital ?? 10000) +
    closedTrades.reduce((s, t) => s + t.pnl, 0) +
    openPositions.reduce((s, p) => s + p.floatingPnl, 0);

  return {
    config,
    setConfig,
    loadSession,
    status,
    error,
    allBars,
    visibleBars,
    currentBar,
    currentIndex,
    totalBars: allBars.length,
    speed,
    setSpeed,
    isPlaying: status === "playing",
    play,
    pause,
    togglePlay,
    stepForward,
    stepBack,
    jumpToEnd,
    setStartBar,
    enterSelectMode,
    placeTrade,
    closePosition,
    openPositions,
    closedTrades,
    sessionMetrics,
    runningBalance,
  };
}
