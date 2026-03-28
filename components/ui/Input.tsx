import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex w-full rounded-md border bg-background-tertiary px-3 py-2 text-sm text-foreground',
              'placeholder:text-foreground-disabled',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors duration-200',
              error
                ? 'border-loss focus:ring-loss'
                : 'border-border hover:border-border-hover',
              icon ? 'pl-10' : undefined,
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-loss">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
