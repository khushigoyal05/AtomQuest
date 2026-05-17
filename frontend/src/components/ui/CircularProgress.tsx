import { useEffect, useRef } from 'react'
import { getScoreColor } from '../../lib/utils'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  label?: string
}

export default function CircularProgress({ value, size = 72, strokeWidth = 6, showLabel = true, label }: CircularProgressProps) {
  const clampedValue = Math.min(150, Math.max(0, value))
  const displayValue = Math.min(100, clampedValue)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayValue / 100) * circumference

  const color = clampedValue >= 90 ? '#10b981' : clampedValue >= 70 ? '#3b82f6' : clampedValue >= 50 ? '#f59e0b' : '#ef4444'

  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.setProperty('--circle-total', String(circumference))
      circleRef.current.style.setProperty('--circle-offset', String(offset))
    }
  }, [circumference, offset])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100 dark:text-zinc-800" />
        <circle
          ref={circleRef}
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className="circle-progress transition-all duration-1000"
          style={{ '--circle-total': circumference, '--circle-offset': offset } as React.CSSProperties}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{Math.round(clampedValue)}%</span>
          {label && <span className="text-xs text-gray-400 leading-none mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  )
}
