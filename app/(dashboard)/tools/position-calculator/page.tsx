'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Calculator, Wallet, AlertTriangle, Target,
    TrendingUp, Check, RotateCcw, DollarSign, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

// Trading instruments with their pip values
const INSTRUMENTS = [
    { symbol: 'XAUUSD', pipValue: 10, pipSize: 0.01, label: 'XAUUSD (Gold)' },
    { symbol: 'EURUSD', pipValue: 10, pipSize: 0.0001, label: 'EURUSD' },
    { symbol: 'GBPUSD', pipValue: 10, pipSize: 0.0001, label: 'GBPUSD' },
    { symbol: 'USDJPY', pipValue: 9.3, pipSize: 0.01, label: 'USDJPY' },
    { symbol: 'BTCUSD', pipValue: 1, pipSize: 1, label: 'BTCUSD (Bitcoin)' },
]

const RISK_PRESETS = [0.5, 1, 2, 3, 5]

// Animation wrapper component for fade-up effect
function AnimatedCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    return (
        <div
            className={cn("animate-fade-up", className)}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    )
}

export default function PositionCalculatorPage() {
    const [accountBalance, setAccountBalance] = useState<number>(10000)
    const [riskPercent, setRiskPercent] = useState<number>(1)
    const [stopLossPips, setStopLossPips] = useState<number>(20)
    const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0])
    const [useCustomPipValue, setUseCustomPipValue] = useState(false)
    const [customPipValue, setCustomPipValue] = useState<number>(10)
    const [calculated, setCalculated] = useState(false)
    const [animationKey, setAnimationKey] = useState(0)

    const pipValue = useCustomPipValue ? customPipValue : selectedInstrument.pipValue

    const calculations = useMemo(() => {
        const riskAmount = (accountBalance * riskPercent) / 100
        const lossAtStop = riskAmount

        const standardLots = riskAmount / (stopLossPips * pipValue)
        const miniLots = standardLots * 10
        const microLots = standardLots * 100

        return {
            standardLots: standardLots.toFixed(2),
            miniLots: miniLots.toFixed(1),
            microLots: microLots.toFixed(0),
            riskAmount: riskAmount.toFixed(2),
            lossAtStop: lossAtStop.toFixed(2),
        }
    }, [accountBalance, riskPercent, stopLossPips, pipValue])

    const handleCalculate = () => {
        setAnimationKey(prev => prev + 1) // Force re-animation
        setCalculated(true)
    }

    const handleReset = () => {
        setAccountBalance(10000)
        setRiskPercent(1)
        setStopLossPips(20)
        setSelectedInstrument(INSTRUMENTS[0])
        setUseCustomPipValue(false)
        setCalculated(false)
    }

    // Input card base styles with hover animation
    const inputCardStyles = "bg-[#12161f] border border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"

    // Result card styles with glow
    const resultCardStyles = "bg-[#12161f] border border-gray-800 rounded-xl p-4 text-center transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Back Link */}
            <Link
                href="/tools"
                className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-all duration-300 hover:-translate-x-1"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tools
            </Link>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <Calculator className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Position Size Calculator</h1>
                    <p className="text-gray-400">Calculate optimal lot size based on risk tolerance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Inputs */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Account Balance */}
                    <div className={inputCardStyles}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                            <Wallet className="w-4 h-4" /> Account Balance
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={accountBalance}
                                onChange={(e) => setAccountBalance(Number(e.target.value))}
                                className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="10,000"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Enter your trading account balance</p>
                    </div>

                    {/* Risk Percentage */}
                    <div className={inputCardStyles}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                            <AlertTriangle className="w-4 h-4" /> Risk Percentage
                        </label>

                        <div className="flex items-baseline justify-between mb-4">
                            <span className="text-4xl font-bold text-blue-400 transition-all duration-300">{riskPercent}%</span>
                            <span className="text-gray-400">${((accountBalance * riskPercent) / 100).toFixed(2)}</span>
                        </div>

                        {/* Slider */}
                        <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.1"
                            value={riskPercent}
                            onChange={(e) => setRiskPercent(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4 transition-all"
                        />

                        {/* Labels */}
                        <div className="flex justify-between text-xs text-gray-500 mb-4">
                            <span>CONSERVATIVE</span>
                            <span>MODERATE</span>
                            <span>AGGRESSIVE</span>
                        </div>

                        {/* Preset Buttons */}
                        <div className="flex gap-2">
                            {RISK_PRESETS.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setRiskPercent(preset)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95",
                                        riskPercent === preset
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                                    )}
                                >
                                    {preset}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stop Loss Distance */}
                    <div className={inputCardStyles}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                            <Target className="w-4 h-4" /> Stop Loss Distance
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={stopLossPips}
                                onChange={(e) => setStopLossPips(Number(e.target.value))}
                                className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="20"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 bg-gray-800 px-3 py-1 rounded-md text-sm">pips</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Distance from entry to stop loss in pips</p>
                    </div>

                    {/* Trading Instrument */}
                    <div className={inputCardStyles}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                            <TrendingUp className="w-4 h-4" /> Trading Instrument
                        </label>
                        <select
                            value={selectedInstrument.symbol}
                            onChange={(e) => setSelectedInstrument(INSTRUMENTS.find(i => i.symbol === e.target.value) || INSTRUMENTS[0])}
                            className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 appearance-none cursor-pointer"
                        >
                            {INSTRUMENTS.map((inst) => (
                                <option key={inst.symbol} value={inst.symbol}>{inst.label}</option>
                            ))}
                        </select>
                        <div className="flex gap-6 mt-3 text-sm text-gray-400">
                            <span>Pip Value: <span className="text-white">${selectedInstrument.pipValue}/lot</span></span>
                            <span>Pip Size: <span className="text-white">{selectedInstrument.pipSize}</span></span>
                        </div>

                        {/* Custom Pip Value */}
                        <label className="flex items-center gap-2 mt-4 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                            <input
                                type="checkbox"
                                checked={useCustomPipValue}
                                onChange={(e) => setUseCustomPipValue(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 transition-all"
                            />
                            Use custom pip value
                        </label>
                        <div className={cn(
                            "overflow-hidden transition-all duration-300",
                            useCustomPipValue ? "max-h-20 opacity-100 mt-3" : "max-h-0 opacity-0"
                        )}>
                            <input
                                type="number"
                                value={customPipValue}
                                onChange={(e) => setCustomPipValue(Number(e.target.value))}
                                className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="10"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button
                            onClick={handleCalculate}
                            className="flex-1 py-4 text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300"
                        >
                            <Calculator className="w-5 h-5 mr-2" /> Calculate Position Size
                        </Button>
                        <Button variant="ghost" onClick={handleReset} className="px-6 hover:bg-gray-800 transition-all duration-300">
                            <RotateCcw className="w-5 h-5 mr-2" /> Reset
                        </Button>
                    </div>
                </div>

                {/* Right Column - Results & Tips */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Results Panel */}
                    {calculated ? (
                        <div key={animationKey} className="animate-fade-up bg-gradient-to-br from-[#12161f] to-[#0d1015] border border-blue-500/30 rounded-2xl p-6 text-center shadow-xl shadow-blue-500/10">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Recommended Position Size</p>
                            <div className="text-6xl font-bold text-blue-400 mb-2 animate-pulse-number">{calculations.standardLots}</div>
                            <p className="text-gray-400 mb-6">Standard Lots</p>
                            <p className="text-sm text-gray-500">Based on {riskPercent}% risk (${calculations.riskAmount})</p>
                        </div>
                    ) : (
                        <div className="bg-[#12161f] border border-gray-800 rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-500/30">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
                                <Layers className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Enter Your Parameters</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Fill in your account balance, risk percentage, and stop loss to calculate your optimal position size.
                            </p>
                        </div>
                    )}

                    {/* Lot Breakdown */}
                    {calculated && (
                        <div key={`breakdown-${animationKey}`} className="grid grid-cols-2 gap-4">
                            <AnimatedCard delay={100} className={resultCardStyles}>
                                <Layers className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 uppercase mb-1">Mini Lots</p>
                                <p className="text-2xl font-bold text-white">{calculations.miniLots}</p>
                                <p className="text-xs text-gray-500">10,000 units</p>
                            </AnimatedCard>
                            <AnimatedCard delay={150} className={resultCardStyles}>
                                <Layers className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 uppercase mb-1">Micro Lots</p>
                                <p className="text-2xl font-bold text-white">{calculations.microLots}</p>
                                <p className="text-xs text-gray-500">1,000 units</p>
                            </AnimatedCard>
                            <AnimatedCard delay={200} className={resultCardStyles}>
                                <DollarSign className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 uppercase mb-1">Risk Amount</p>
                                <p className="text-2xl font-bold text-white">${calculations.riskAmount}</p>
                                <p className="text-xs text-gray-500">{riskPercent}% of balance</p>
                            </AnimatedCard>
                            <AnimatedCard delay={250} className={resultCardStyles}>
                                <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 uppercase mb-1">Loss at Stop</p>
                                <p className="text-2xl font-bold text-red-400">${calculations.lossAtStop}</p>
                                <p className="text-xs text-gray-500">If SL is hit</p>
                            </AnimatedCard>
                        </div>
                    )}

                    {/* Tips Card */}
                    <div className={cn(inputCardStyles, "")}>
                        <h4 className="font-semibold text-white mb-4">Trading Tips</h4>
                        <ul className="space-y-3">
                            {[
                                'Most professionals risk 1-2% per trade',
                                'Always define your stop loss before entering',
                                'Position sizing is key to long-term survival',
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-400 transition-all duration-300 hover:text-white hover:translate-x-1">
                                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Trade Summary */}
                    {calculated && (
                        <AnimatedCard delay={300} className={cn(inputCardStyles, "")}>
                            <h4 className="font-semibold text-white mb-4">Trade Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="transition-all duration-300 hover:translate-x-1">
                                    <p className="text-gray-500">Account Balance</p>
                                    <p className="text-white font-medium">${accountBalance.toLocaleString()}</p>
                                </div>
                                <div className="transition-all duration-300 hover:translate-x-1">
                                    <p className="text-gray-500">Symbol</p>
                                    <p className="text-white font-medium">{selectedInstrument.symbol}</p>
                                </div>
                                <div className="transition-all duration-300 hover:translate-x-1">
                                    <p className="text-gray-500">Stop Loss</p>
                                    <p className="text-white font-medium">{stopLossPips} pips</p>
                                </div>
                                <div className="transition-all duration-300 hover:translate-x-1">
                                    <p className="text-gray-500">Pip Value</p>
                                    <p className="text-white font-medium">${pipValue}/pip/lot</p>
                                </div>
                            </div>
                        </AnimatedCard>
                    )}
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-number {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .animate-fade-up {
          animation: fade-up 0.5s ease-out forwards;
        }
        
        .animate-pulse-number {
          animation: pulse-number 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    )
}
