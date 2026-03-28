"use client";

import { useState } from "react";
import { Brain, Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "./EconomicCalendar";
import { AssetIcon } from "@/components/market/AssetIcon";

interface AIAnalysisData {
    summary: string;
    bullish: boolean;
    confidence: number;
    sourceQuality: "High" | "Medium" | "Low";
    impacts: {
        pair: string;
        direction: "Bullish" | "Bearish" | "Neutral";
        pips: string;
        reason: string;
        sentiment: "High" | "Medium" | "Low";
    }[];
    scenarios: {
        better: string;
        worse: string;
        expected: string;
    };
    tradingTip: string;
}

interface AIEventAnalysisProps {
    event: CalendarEvent;
}

export function AIEventAnalysis({ event }: AIEventAnalysisProps) {
    const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/market/analyze-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: event.event,
                    currency: event.currency,
                    country: event.country,
                    actual: event.actual,
                    forecast: event.forecast,
                    previous: event.previous
                })
            });

            if (!res.ok) throw new Error("Failed to generate analysis");

            const data = await res.json();
            setAnalysis(data);
        } catch (err) {
            console.error(err);
            setError("Failed to generate insights. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!analysis && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-[var(--background-secondary)]/50 rounded-lg border border-dashed border-[var(--border)]">
                <div className="bg-blue-500/10 p-3 rounded-full mb-3">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-sm font-medium mb-1">AI Market Insights</h3>
                <p className="text-xs text-[var(--foreground-muted)] mb-4 text-center max-w-[300px]">
                    Generate real-time analysis, impact projections, and trading scenarios for this event.
                </p>
                <button
                    onClick={generateAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                >
                    <Brain className="w-4 h-4" />
                    Generate Insights
                </button>
                {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 space-y-4 animate-pulse bg-[var(--background-secondary)]/30 rounded-lg">
                <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                <div className="h-20 bg-gray-700/30 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-gray-700/30 rounded-lg"></div>
                    <div className="h-32 bg-gray-700/30 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="mt-4 space-y-4 text-left">
            {/* Header / Summary */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold">AI Market Analysis</span>
                    <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto uppercase",
                        analysis.bullish ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {analysis.bullish ? `Bullish ${event.currency}` : `Bearish ${event.currency}`}
                    </span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {analysis.summary}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metrics */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold mb-2">Confidence Score</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-blue-400">{analysis.confidence}%</span>
                    </div>
                    <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                        Based on historical correlation and macro context.
                    </p>
                </div>

                {/* Source Quality */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold mb-2">Source Importance</span>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full",
                            analysis.sourceQuality === 'High' ? "bg-red-500" :
                                analysis.sourceQuality === 'Medium' ? "bg-orange-500" : "bg-yellow-500"
                        )} />
                        <span className="text-lg font-semibold">{analysis.sourceQuality}</span>
                    </div>
                    <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                        {analysis.sourceQuality === 'High' ? "Major market mover." : "Moderate market impact."}
                    </p>
                </div>

                {/* Trading Tip */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-blue-400 uppercase font-bold">Trading Tip</span>
                    </div>
                    <p className="text-xs text-[var(--foreground)] italic">
                        "{analysis.tradingTip}"
                    </p>
                </div>
            </div>

            {/* Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {analysis.impacts.map((impact, idx) => (
                    <div key={idx} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--foreground-muted)] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <AssetIcon symbol={impact.pair} size="sm" />
                                <span className="font-bold text-xs">{impact.pair}</span>
                            </div>
                            <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                impact.direction === "Bullish" ? "text-green-400 bg-green-500/10" :
                                    impact.direction === "Bearish" ? "text-red-400 bg-red-500/10" : "text-gray-400 bg-gray-500/10"
                            )}>
                                {impact.direction}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                            <TrendingUp className="w-3 h-3 text-[var(--foreground-muted)]" />
                            <span className="text-[10px] font-semibold">{impact.pips} pips</span>
                        </div>
                        <p className="text-[10px] text-[var(--foreground-muted)] leading-tight">
                            {impact.reason}
                        </p>
                    </div>
                ))}
            </div>

            {/* Scenarios */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-[var(--border)] text-center text-[10px] font-bold uppercase bg-[var(--background-secondary)]">
                    <div className="p-2 text-green-400">Better Than Expected</div>
                    <div className="p-2 text-gray-400">As Expected</div>
                    <div className="p-2 text-red-400">Worse Than Expected</div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[var(--border)] text-xs">
                    <div className="p-3 text-[var(--foreground-muted)]">{analysis.scenarios.better}</div>
                    <div className="p-3 text-[var(--foreground-muted)]">{analysis.scenarios.expected}</div>
                    <div className="p-3 text-[var(--foreground-muted)]">{analysis.scenarios.worse}</div>
                </div>
            </div>
        </div>
    );
}

function Lightbulb({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
        </svg>
    )
}
