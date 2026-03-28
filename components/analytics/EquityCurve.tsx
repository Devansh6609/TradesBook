'use client'

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, Time, WhitespaceData, LineData } from 'lightweight-charts'
import { EquityPoint } from '@/types'
import { cn } from '@/lib/utils'

interface EquityCurveProps {
  data: EquityPoint[]
  className?: string
  height?: number
}

export function EquityCurve({ data, className, height = 400 }: EquityCurveProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    // Dynamically import to avoid SSR issues if needed, but createChart is already imported
    const initChart = async () => {
      // Create chart
      const chart = createChart(chartContainerRef.current!, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#a1a1aa',
        },
        grid: {
          vertLines: { color: '#27272a' },
          horzLines: { color: '#27272a' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#3b82f6',
            width: 1,
            style: 2,
            labelBackgroundColor: '#3b82f6',
          },
          horzLine: {
            color: '#3b82f6',
            width: 1,
            style: 2,
            labelBackgroundColor: '#3b82f6',
          },
        },
        rightPriceScale: {
          borderColor: '#27272a',
        },
        timeScale: {
          borderColor: '#27272a',
          timeVisible: true,
        },
        height,
      })

      chartRef.current = chart

      // Add equity series (main line)
      // Cast to any because the installed version seems to have mixed v3/v4 types
      const equitySeries = (chart as any).addAreaSeries({
        lineColor: '#3b82f6',
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.05)',
        lineWidth: 2,
        title: 'Equity',
      })

      // Add drawdown series (secondary area)
      const drawdownSeries = (chart as any).addAreaSeries({
        lineColor: '#ef4444',
        topColor: 'rgba(239, 68, 68, 0.3)',
        bottomColor: 'rgba(239, 68, 68, 0.05)',
        lineWidth: 1,
        title: 'Drawdown',
      })

      // Set data and ensure it is sorted strictly ascending with unique timestamps
      const uniqueDataMap = new Map<number, { value: number; drawdown: number }>()

      data.forEach(point => {
        // Lightweight charts requires time in seconds for Unix Timestamps
        const timeInSeconds = Math.floor(new Date(point.time).getTime() / 1000)
        // If there are multiple trades in the exact same second, we keep the last one (or we could sum them, but last state of equity makes sense)
        uniqueDataMap.set(timeInSeconds, { value: point.value, drawdown: point.drawdown })
      })

      const sortedTimes = Array.from(uniqueDataMap.keys()).sort((a, b) => a - b)

      const equityData: (LineData<Time> | WhitespaceData<Time>)[] = sortedTimes.map(time => ({
        time: time as Time,
        value: uniqueDataMap.get(time)!.value,
      }))

      const drawdownData: (LineData<Time> | WhitespaceData<Time>)[] = sortedTimes.map(time => ({
        time: time as Time,
        value: uniqueDataMap.get(time)!.drawdown,
      }))

      equitySeries.setData(equityData)
      drawdownSeries.setData(drawdownData)

      // Fit content
      chart.timeScale().fitContent()

      // Handle resize
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
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-background-secondary rounded-xl border border-border',
        className
      )} style={{ height }}>
        <p className="text-foreground-muted">No data available</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div ref={chartContainerRef} className="rounded-xl overflow-hidden" />
    </div>
  )
}
