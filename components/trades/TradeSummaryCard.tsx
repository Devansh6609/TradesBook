import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TradeSummaryCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function TradeSummaryCard({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend,
  className 
}: TradeSummaryCardProps) {
  return (
    <div className={cn(
      "bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-full",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
          {label}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-white/5 text-[#475569]">
            <Icon size={16} />
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded-md",
              trend.isPositive ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
        {subValue && (
          <div className="text-[11px] font-medium text-foreground-disabled">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}
