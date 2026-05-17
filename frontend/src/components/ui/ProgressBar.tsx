import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
  animated?: boolean
}

export default function ProgressBar({ value, max = 100, className, showLabel = false, size = 'md', color, animated = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor = color || (pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500')
  const height = { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size]

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden', height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', barColor, animated && 'progress-animated')}
          style={{ width: `${pct}%`, '--progress-width': `${pct}%` } as React.CSSProperties}
        />
      </div>
      {showLabel && <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(pct)}%</p>}
    </div>
  )
}
