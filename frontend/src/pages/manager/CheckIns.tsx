import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { getStatusColor, getStatusLabel, getThrustAreaColor, getInitials } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

interface Goal {
  id: string
  thrustArea: string
  title: string
  uom: string
  target: number
  weightage: number
  status: string
  employee: { id: string; name: string; email: string }
  achievements: { quarter: string; actualValue?: number; computedScore?: number; status: string }[]
  checkIns: { quarter: string; comment: string; manager: { name: string } }[]
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export default function ManagerCheckIns() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuarter, setActiveQuarter] = useState('Q1')
  const [comments, setComments] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals/manager/team')
      const approvedGoals = res.data.goals.filter((g: Goal) => g.status === 'APPROVED')
      setGoals(approvedGoals)
      const initial: typeof comments = {}
      approvedGoals.forEach((g: Goal) => {
        const existing = g.checkIns?.find((c) => c.quarter === 'Q1')
        initial[`${g.id}_Q1`] = existing?.comment || ''
      })
      setComments(initial)
    } catch { toast.error('Failed to load check-ins') }
    finally { setLoading(false) }
  }

  const handleSaveComment = async (goalId: string, quarter: string) => {
    const key = `${goalId}_${quarter}`
    const comment = comments[key]?.trim()
    if (!comment) { toast.error('Please enter a comment'); return }
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      await api.post('/checkins', { goalId, quarter, comment })
      toast.success('Check-in comment saved!')
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Save failed') }
    finally { setSaving((s) => ({ ...s, [key]: false })) }
  }

  const employeeIds = [...new Set(goals.map((g) => g.employee.id))]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="page-title">Team Check-ins</h1>
        <p className="text-sm text-gray-500 mt-1">Add structured check-in comments for each team member per quarter</p>
      </div>

      {/* Quarter Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl w-fit">
        {QUARTERS.map((q) => (
          <button key={q} onClick={() => setActiveQuarter(q)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeQuarter === q ? 'bg-white dark:bg-zinc-800 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {q}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={40} className="text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-400">No approved goals to check in on</p>
        </div>
      ) : (
        <div className="space-y-6">
          {employeeIds.map((empId) => {
            const empGoals = goals.filter((g) => g.employee.id === empId)
            const emp = empGoals[0]?.employee
            return (
              <motion.div key={empId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    {emp && getInitials(emp.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{emp?.name}</p>
                    <p className="text-xs text-gray-500">{empGoals.length} goals · {activeQuarter} Check-in</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {empGoals.map((goal) => {
                    const key = `${goal.id}_${activeQuarter}`
                    const ach = goal.achievements.find((a) => a.quarter === activeQuarter)
                    const existingCheckin = goal.checkIns?.find((c) => c.quarter === activeQuarter)

                    return (
                      <div key={goal.id} className="p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThrustAreaColor(goal.thrustArea)}`}>{goal.thrustArea}</span>
                            </div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">{goal.title}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Target: {goal.target}</p>
                            {ach?.actualValue !== undefined && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Actual: {ach.actualValue}</p>}
                            {ach?.computedScore !== undefined && (
                              <p className={`text-sm font-bold ${ach.computedScore < 50 ? 'text-red-600' : 'text-emerald-600'}`}>{ach.computedScore.toFixed(1)}%</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="label flex items-center gap-1.5">
                            <MessageSquare size={13} /> Check-in Comment for {activeQuarter}
                          </label>
                          <textarea
                            value={comments[key] || ''}
                            onChange={(e) => setComments((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder={`Add your ${activeQuarter} check-in comment for this goal...`}
                            rows={3}
                            className="input resize-none text-sm"
                          />
                          {existingCheckin && (
                            <p className="text-xs text-gray-400 mt-1">Last saved by {existingCheckin.manager.name}</p>
                          )}
                        </div>

                        <div className="flex justify-end mt-3">
                          <button onClick={() => handleSaveComment(goal.id, activeQuarter)} disabled={saving[key]}
                            className="btn-primary text-sm py-1.5">
                            {saving[key] ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><Save size={13} /> Save Comment</>}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
