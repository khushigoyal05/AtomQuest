import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'badge-gray',
    SUBMITTED: 'badge-amber',
    APPROVED: 'badge-green',
    RETURNED: 'badge-red',
    LOCKED: 'badge-blue',
    NOT_STARTED: 'badge-gray',
    ON_TRACK: 'badge-green',
    COMPLETED: 'badge-blue',
    PENDING: 'badge-amber',
    RESOLVED: 'badge-green',
  }
  return map[status] || 'badge-gray'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    RETURNED: 'Returned',
    LOCKED: 'Locked',
    NOT_STARTED: 'Not Started',
    ON_TRACK: 'On Track',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    RESOLVED: 'Resolved',
    NUMERIC_HIGHER: 'Numeric (Higher)',
    NUMERIC_LOWER: 'Numeric (Lower)',
    TIMELINE: 'Timeline',
    ZERO_BASED: 'Zero-Based',
    GOAL_SETTING: 'Goal Setting',
    Q1_CHECKIN: 'Q1 Check-in',
    Q2_CHECKIN: 'Q2 Check-in',
    Q3_CHECKIN: 'Q3 Check-in',
    Q4_ANNUAL: 'Annual Review',
  }
  return map[status] || status
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-blue-600 dark:text-blue-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getThrustAreaColor(area: string): string {
  const colors = [
    'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  ]
  let hash = 0
  for (let i = 0; i < area.length; i++) hash = area.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export const THRUST_AREAS = [
  'Digital Transformation',
  'Quality & Excellence',
  'Customer Success',
  'Innovation',
  'Learning & Development',
  'Revenue',
  'Analytics & Insights',
  'Process Improvement',
  'Collaboration',
  'Product Excellence',
]

export const UOM_OPTIONS = [
  { value: 'NUMERIC_HIGHER', label: 'Numeric — Higher is Better', description: 'Score = Actual ÷ Target' },
  { value: 'NUMERIC_LOWER', label: 'Numeric — Lower is Better', description: 'Score = Target ÷ Actual' },
  { value: 'TIMELINE', label: 'Timeline (% Completion)', description: 'Score based on % progress made' },
  { value: 'ZERO_BASED', label: 'Zero-Based', description: 'Score = 100% if Actual = 0, else 0%' },
]

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
