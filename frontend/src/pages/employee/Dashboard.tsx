import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, PlusCircle, MessageSquare, Activity, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { getStatusColor, getStatusLabel, getScoreColor, getScoreBarColor, getThrustAreaColor, formatDate } from '../../lib/utils'
import CircularProgress from '../../components/ui/CircularProgress'
import ProgressBar from '../../components/ui/ProgressBar'
import { toast } from 'sonner'

interface Goal {
  id: string
  thrustArea: string
  title: string
  description?: string
  uom: string
  target: number
  weightage: number
  status: string
  isLocked: boolean
  deadline?: string
  achievements: { quarter: string; actualValue?: number; computedScore?: number; status: string }[]
  _count: { comments: number }
}

interface Cycle {
  id: string
  phaseName: string
  label: string
  opensAt: string
  closesAt: string
  isActive: boolean
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [goalsRes, cyclesRes] = await Promise.all([
        api.get('/goals'),
        api.get('/admin/cycles'),
      ])
      setGoals(goalsRes.data)
      setCycles(cyclesRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const activeCycle = cycles.find((c) => c.isActive)
  const approvedGoals = goals.filter((g) => g.status === 'APPROVED' || g.isLocked)
  const draftGoals = goals.filter((g) => ['DRAFT', 'RETURNED'].includes(g.status))
  const submittedGoals = goals.filter((g) => g.status === 'SUBMITTED')

  const currentQ1Achievements = approvedGoals.flatMap((g) => g.achievements.filter((a) => a.quarter === 'Q1'))
  const avgScore = currentQ1Achievements.length > 0
    ? currentQ1Achievements.reduce((s, a) => s + (a.computedScore || 0), 0) / currentQ1Achievements.length : 0

  const totalWeightage = goals.filter((g) => ['DRAFT', 'RETURNED'].includes(g.status)).reduce((s, g) => s + g.weightage, 0)
  const atRiskGoals = approvedGoals.filter((g) => {
    const latest = g.achievements[g.achievements.length - 1]
    return latest && (latest.computedScore || 0) < 50
  })

  const stats = [
    { label: 'Total Goals', value: goals.length, icon: Target, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/30' },
    { label: 'Avg Score (Q1)', value: `${Math.round(avgScore)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'At Risk', value: atRiskGoals.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Approved', value: approvedGoals.length, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse"><div className="h-16 bg-gray-100 dark:bg-zinc-800 rounded" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Here's your goal performance summary</p>
        </div>
        {activeCycle && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">{activeCycle.label}</span>
          </div>
        )}
      </div>

      {/* Active Phase Banner */}
      {activeCycle && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center gap-3 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-950/20 dark:to-violet-950/20 border-primary-200 dark:border-primary-800">
          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Clock className="text-primary-600 dark:text-primary-400" size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">Active Phase: {activeCycle.label}</p>
            <p className="text-xs text-primary-600 dark:text-primary-400">Window: {formatDate(activeCycle.opensAt)} → {formatDate(activeCycle.closesAt)}</p>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={15} className={stat.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Weightage indicator */}
      {draftGoals.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Draft Weightage Total</p>
            <span className={`text-sm font-bold ${Math.abs(totalWeightage - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>{totalWeightage.toFixed(1)}% / 100%</span>
          </div>
          <ProgressBar value={totalWeightage} max={100} color={Math.abs(totalWeightage - 100) < 0.01 ? 'bg-emerald-500' : totalWeightage > 100 ? 'bg-red-500' : 'bg-amber-500'} />
          {Math.abs(totalWeightage - 100) > 0.01 && (
            <p className="text-xs text-amber-600 mt-1.5">⚠️ Total weightage must equal 100% before submitting</p>
          )}
        </div>
      )}

      {/* Goal Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">My Goals</h2>
          <span className="text-xs text-gray-500">{goals.length} / 8 goals</span>
        </div>
        {goals.length === 0 ? (
          <div className="card p-12 text-center">
            <Target size={40} className="text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">No goals yet</h3>
            <p className="text-sm text-gray-400 mt-1">Head to "My Goals" to create your first goal</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map((goal, i) => {
              const q1 = goal.achievements.find((a) => a.quarter === 'Q1')
              const score = q1?.computedScore
              const isAtRisk = score !== undefined && score < 50
              return (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card p-5 hover:shadow-md transition-shadow duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThrustAreaColor(goal.thrustArea)}`}>{goal.thrustArea}</span>
                        {isAtRisk && (
                          <span className="badge-red gap-1"><AlertTriangle size={10} /> At Risk</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{goal.title}</h3>
                    </div>
                    {score !== undefined && (
                      <CircularProgress value={score} size={52} strokeWidth={4} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs ${getStatusColor(goal.status)}`}>{getStatusLabel(goal.status)}</span>
                    <span className="text-gray-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-gray-500">W: {goal.weightage}%</span>
                    <span className="text-gray-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-gray-500">T: {goal.target}</span>
                  </div>

                  {score !== undefined && (
                    <ProgressBar value={score} max={100} size="sm" color={getScoreBarColor(score)} />
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MessageSquare size={11} /> {goal._count.comments}
                    </span>
                    {goal.deadline && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {formatDate(goal.deadline)}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-gray-400">{getStatusLabel(goal.uom)}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-gray-500" />
          <h2 className="section-title">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {[
            { icon: '✅', text: 'Your goals were approved by your manager', time: '2 days ago' },
            { icon: '📊', text: 'Q1 check-in window is now open', time: '1 week ago' },
            { icon: '📝', text: 'Manager added a check-in comment on "Reduce API Response Time"', time: '3 days ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="text-gray-700 dark:text-gray-300">{item.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
