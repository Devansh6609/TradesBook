'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RollingNumberProps {
    value: number
    prefix?: string
    suffix?: string
    decimalPlaces?: number
    className?: string
    baseColor?: string
}

function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>()
    useEffect(() => {
        ref.current = value
    }, [value])
    return ref.current
}

export default function RollingNumber({
    value,
    prefix = '',
    suffix = '',
    decimalPlaces = 2,
    className,
    baseColor = 'text-white',
}: RollingNumberProps) {
    const prevValue = usePrevious(value)
    const [trend, setTrend] = useState<'up' | 'down' | 'none'>('none')
    const [isPulsing, setIsPulsing] = useState(false)

    // Format value to string once
    const formatted = Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(value)

    const characters = formatted.split("")

    useEffect(() => {
        if (prevValue === undefined) return
        
        if (value > prevValue) {
            setTrend('up')
            setIsPulsing(true)
        } else if (value < prevValue) {
            setTrend('down')
            setIsPulsing(true)
        }

        const timer = setTimeout(() => {
            setIsPulsing(false)
            setTrend('none')
        }, 1500)

        return () => clearTimeout(timer)
    }, [value, prevValue])

    const trendColor = trend === 'up' ? 'text-blue-500' : trend === 'down' ? 'text-loss-light' : baseColor

    return (
        <span className={cn("inline-flex items-center overflow-hidden h-[1.1em] leading-none select-none", className)}>
            {prefix && <span className={cn("transition-colors duration-500", trendColor)}>{prefix}</span>}
            
            <div className="flex">
                {characters.map((char, index) => {
                    const isDigit = /[0-9]/.test(char)
                    
                    if (!isDigit) {
                        return (
                            <span key={index} className={cn("transition-colors duration-500", trendColor)}>
                                {char}
                            </span>
                        )
                    }

                    return (
                        <DigitColumn 
                            key={index} 
                            digit={parseInt(char)} 
                            className={trendColor} 
                        />
                    )
                })}
            </div>

            {suffix && <span className={cn("transition-colors duration-500 ml-0.5", trendColor)}>{suffix}</span>}
        </span>
    )
}

function DigitColumn({ digit, className }: { digit: number; className?: string }) {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    return (
        <div className="relative w-[0.6em] h-[1em] overflow-hidden">
            <motion.div
                animate={{ y: `-${digit * 10}%` }}
                transition={{
                    type: "spring",
                    stiffness: 80,
                    damping: 20,
                    mass: 1
                }}
                className={cn("flex flex-col absolute top-0 left-0 transition-colors duration-500", className)}
                style={{ height: "1000%" }}
            >
                {digits.map((d) => (
                    <div 
                        key={d} 
                        className="h-[10%] flex items-center justify-center font-extrabold"
                    >
                        {d}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
