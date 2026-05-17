import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Target, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'
import { getStatusColor, getStatusLabel, getScoreBarColor, getInitials } from '../../lib/utils'
import ProgressBar from '../../components/ui/ProgressBar'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

interface Employee {
  id: string
  name: string
  email: string
  department: string
}

interface Goal {
  id: string
  employeeId: string
  thrustArea: string
  title: string
  status: string
  weightage: number
  employee: Employee
  achievements: { quarter: string; computedScore?: number; status: string }[]
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/goals/manager/team')
      setEmployees(res.data.employees)
      setGoals(res.data.goals)
    } catch { toast.error('Failed to load team data') }
    finally { setLoading(false) }
  }

  const getEmployeeGoals = (empId: string) => goals.filter((g) => g.employeeId === empId)
  const getEmployeeStatus = (empId: string) => {
    const empGoals = getEmployeeGoals(empId)
    if (empGoals.length === 0) return 'NO_GOALS'
    if (empGoals.every((g) => g.status === 'APPROVED')) return 'APPROVED'
    if (empGoals.some((g) => g.status === 'SUBMITTED')) return 'SUBMITTED'
    return 'DRAFT'
  }

  const getEmployeeScore = (empId: string) => {
    const empGoals = getEmployeeGoals(empId)
    const scores = empGoals.flatMap((g) => g.achievements.filter((a) => a.quarter === 'Q1').map((a) => ({ score: a.computedScore || 0, weightage: g.weightage })))
    if (scores.length === 0) return null
    return scores.reduce((s, a) => s + (a.score * a.weightage / 100), 0)
  }

  const statusCounts = {
    approved: employees.filter((e) => getEmployeeStatus(e.id) === 'APPROVED').length,
    submitted: employees.filter((e) => getEmployeeStatus(e.id) === 'SUBMITTED').length,
    draft: employees.filter((e) => ['DRAFT', 'NO_GOALS'].includes(getEmployeeStatus(e.id))).length,
  }

  const pendingApprovals = goals.filter((g) => g.status === 'SUBMITTED').length

  const stats = [
    { label: 'Team Members', value: employees.length, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/30' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Goals Approved', value: statusCounts.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Total Goals', value: goals.length, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="page-title">Team Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your team's goal progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card">
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

      {/* Submission Status Distribution */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Team Submission Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-2xl font-bold text-emerald-600">{statusCounts.approved}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Goals Approved</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.submitted}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Pending Review</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-zinc-900">
            <p className="text-2xl font-bold text-gray-500">{statusCounts.draft}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Not Submitted</p>
          </div>
        </div>
      </div>

      {/* Team Member Cards */}
      <div>
        <h2 className="section-title mb-4">Team Members</h2>
        <div className="space-y-3">
          {employees.map((emp, i) => {
            const empGoals = getEmployeeGoals(emp.id)
            const status = getEmployeeStatus(emp.id)
            const score = getEmployeeScore(emp.id)
            const atRiskCount = empGoals.filter((g) => g.achievements.some((a) => a.quarter === 'Q1' && (a.computedScore || 0) < 50)).length

            return (
              <motion.div key={emp.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{emp.name}</h3>
                      <span className="text-xs text-gray-400">{emp.department}</span>
                      {atRiskCount > 0 && <span className="badge-red text-xs"><AlertTriangle size={10} /> {atRiskCount} At Risk</span>}
                    </div>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={getStatusColor(status === 'NO_GOALS' ? 'DRAFT' : status)}>
                        {status === 'NO_GOALS' ? 'No Goals' : getStatusLabel(status)}
                      </span>
                      <span className="text-xs text-gray-400">{empGoals.length} goals</span>
                    </div>
                    {score !== null && score !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <ProgressBar value={score} max={100} size="sm" className="flex-1" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-10 text-right">{score.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
