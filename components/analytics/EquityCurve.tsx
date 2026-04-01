import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, Time, WhitespaceData, LineData, ColorType } from 'lightweight-charts'
import { EquityPoint } from '@/types'
import { cn } from '@/lib/utils'
import { TrendingUp, BarChart, Info, MousePointer2 } from 'lucide-react'

interface EquityCurveProps {
  data: EquityPoint[]
  className?: string
  height?: number
  trades?: any[]
}

export function EquityCurve({ data, className, height = 400, trades = [] }: EquityCurveProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [activeTab, setActiveTab] = useState<'equity' | 'drawdown'>('equity')

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    const initChart = async () => {
      const chart = createChart(chartContainerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#ffffff20',
          fontSize: 10,
          fontFamily: 'Plus Jakarta Sans',
        },
        grid: {
          vertLines: { color: '#ffffff03' },
          horzLines: { color: '#ffffff03' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#3b82f640',
            width: 1,
            style: 2,
            labelBackgroundColor: '#3b82f6',
          },
          horzLine: {
            color: '#3b82f640',
            width: 1,
            style: 2,
            labelBackgroundColor: '#3b82f6',
          },
        },
        rightPriceScale: {
          borderColor: '#ffffff05',
          alignLabels: true,
          scaleMargins: {
            top: 0.2,
            bottom: 0.2,
          },
        },
        timeScale: {
          borderColor: '#ffffff05',
          timeVisible: true,
          secondsVisible: false,
        },
        height: height - 100, // Account for header space
      })

      chartRef.current = chart

      // Add equity series
      const series = chart.addAreaSeries({
        lineColor: '#3b82f6',
        topColor: 'rgba(59, 130, 246, 0.2)',
        bottomColor: 'rgba(59, 130, 246, 0.01)',
        lineWidth: 2,
        priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
        },
      })

      const uniqueDataMap = new Map<number, { value: number }>()

      data.forEach(point => {
        const timeInSeconds = Math.floor(new Date(point.time).getTime() / 1000)
        uniqueDataMap.set(timeInSeconds, { value: point.value })
      })

      const sortedTimes = Array.from(uniqueDataMap.keys()).sort((a, b) => a - b)

      const equityData: (LineData<Time> | WhitespaceData<Time>)[] = sortedTimes.map(time => ({
        time: time as Time,
        value: uniqueDataMap.get(time)!.value,
      }))

      series.setData(equityData)
      chart.timeScale().fitContent()

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    }

    const cleanup = initChart()

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [data, height, activeTab])

  return (
    <div className={cn('bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 flex flex-col', className)} style={{ height }}>
       <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <TrendingUp size={20} />
             </div>
             <div>
                <h3 className="text-base font-black text-white/90 font-jakarta tracking-tight">Equity Curve</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mt-0.5">Cumulative P&L progression</p>
             </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('equity')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  activeTab === 'equity' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
             >
                Equity
             </button>
             <button 
                onClick={() => setActiveTab('drawdown')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  activeTab === 'drawdown' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
             >
                Drawdown
             </button>
          </div>
       </div>

       <div className="flex-1 w-full relative">
          {data.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
               <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-blue-500/5 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <TrendingUp size={24} strokeWidth={2.5} />
                     </div>
                  </div>
               </div>
               <h4 className="text-sm font-black text-white/80 uppercase tracking-[0.2em] mb-2">Awaiting Execution</h4>
               <p className="text-[11px] font-medium text-white/20 max-w-[200px] leading-relaxed uppercase tracking-wider">
                  Close more trades to see your equity curve progression
               </p>
            </div>
          ) : (
            <div ref={chartContainerRef} className="w-full h-full" />
          )}
       </div>
    </div>
  )
}
