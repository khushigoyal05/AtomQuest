import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Target, CheckCircle2, AlertTriangle, TrendingUp, Download, BarChart3, Settings } from 'lucide-react'
import { api } from '../../lib/api'
import ProgressBar from '../../components/ui/ProgressBar'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface Overview {
  totalEmployees: number
  totalGoals: number
  approvedGoals: number
  submittedGoals: number
  draftGoals: number
  pendingEscalations: number
  avgScore: number
}

interface CompletionRates {
  total: number
  withApproved: number
  withSubmitted: number
  withDraft: number
  withNone: number
}

const COLORS = ['#10b981', '#f59e0b', '#6b7280', '#ef4444']

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [completionRates, setCompletionRates] = useState<CompletionRates | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [overviewRes, ratesRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/admin/completion-rates'),
      ])
      setOverview(overviewRes.data)
      setCompletionRates(ratesRes.data)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/export/achievements', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'AtomQuest_Achievements.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel report downloaded!')
    } catch { toast.error('Export failed') }
  }

  const completionPieData = completionRates ? [
    { name: 'Approved', value: completionRates.withApproved },
    { name: 'Submitted', value: completionRates.withSubmitted },
    { name: 'Draft', value: completionRates.withDraft },
    { name: 'No Goals', value: completionRates.withNone },
  ] : []

  const stats = overview ? [
    { label: 'Total Employees', value: overview.totalEmployees, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/30' },
    { label: 'Total Goals', value: overview.totalGoals, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Approved Goals', value: overview.approvedGoals, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Avg Score', value: `${overview.avgScore}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Pending Escalations', value: overview.pendingEscalations, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Submitted Goals', value: overview.submittedGoals, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ] : []

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Organization-wide goal tracking overview</p>
        </div>
        <button onClick={handleExport} className="btn-primary text-sm py-2">
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">{stat.label}</p>
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={13} className={stat.color} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Completion Rate + Pie */}
      {completionRates && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="section-title mb-4">Goal Submission Completion</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Goals Approved</span>
                  <span className="font-semibold text-emerald-600">{completionRates.withApproved}/{completionRates.total}</span>
                </div>
                <ProgressBar value={completionRates.withApproved} max={completionRates.total} color="bg-emerald-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Pending Submission</span>
                  <span className="font-semibold text-amber-600">{completionRates.withSubmitted}/{completionRates.total}</span>
                </div>
                <ProgressBar value={completionRates.withSubmitted} max={completionRates.total} color="bg-amber-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Still Draft</span>
                  <span className="font-semibold text-gray-500">{completionRates.withDraft}/{completionRates.total}</span>
                </div>
                <ProgressBar value={completionRates.withDraft} max={completionRates.total} color="bg-gray-400" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">Employee Status Distribution</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {completionPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} employees`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {completionPieData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/cycles', label: 'Configure Cycles', icon: Settings, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/30' },
          { href: '/admin/org', label: 'Org Hierarchy', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { href: '/admin/escalations', label: 'Escalations', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
          { href: '/admin/audit', label: 'Audit Trail', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        ].map((item, i) => (
          <a key={i} href={item.href} className="card p-5 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
              <item.icon size={18} className={item.color} />
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
