import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, TrendingUp, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { getStatusColor, getStatusLabel, getThrustAreaColor } from '../../lib/utils'
import CircularProgress from '../../components/ui/CircularProgress'
import { toast } from 'sonner'

interface Goal {
  id: string
  thrustArea: string
  title: string
  uom: string
  target: number
  weightage: number
  status: string
  isLocked: boolean
  achievements: { id: string; quarter: string; actualValue?: number; computedScore?: number; status: string }[]
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUS_OPTIONS = ['NOT_STARTED', 'ON_TRACK', 'COMPLETED']

export default function EmployeeCheckIn() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuarter, setActiveQuarter] = useState('Q1')
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [inputs, setInputs] = useState<Record<string, { actualValue: string; status: string; notes: string }>>({})

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals')
      const approved = res.data.filter((g: Goal) => g.isLocked || g.status === 'APPROVED')
      setGoals(approved)
      const initial: typeof inputs = {}
      approved.forEach((g: Goal) => {
        QUARTERS.forEach((q) => {
          const ach = g.achievements.find((a) => a.quarter === q)
          initial[`${g.id}_${q}`] = { actualValue: ach?.actualValue !== undefined ? String(ach.actualValue) : '', status: ach?.status || 'NOT_STARTED', notes: '' }
        })
      })
      setInputs(initial)
    } catch { toast.error('Failed to load goals') }
    finally { setLoading(false) }
  }

  const handleSave = async (goalId: string, quarter: string) => {
    const key = `${goalId}_${quarter}`
    const input = inputs[key]
    if (!input) return
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      await api.post('/achievements', { goalId, quarter, actualValue: input.actualValue ? parseFloat(input.actualValue) : undefined, status: input.status, notes: input.notes })
      toast.success(`Q${quarter.slice(1)} progress saved!`)
      fetchGoals()
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Save failed') }
    finally { setSaving((s) => ({ ...s, [key]: false })) }
  }

  const setInput = (key: string, field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="page-title">Quarterly Check-in</h1>
        <p className="text-sm text-gray-500 mt-1">Log your actual achievements for each quarter</p>
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
          <CheckSquare size={40} className="text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">No approved goals yet</h3>
          <p className="text-sm text-gray-400">Goals must be approved before you can log achievements</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, i) => {
            const key = `${goal.id}_${activeQuarter}`
            const input = inputs[key] || { actualValue: '', status: 'NOT_STARTED', notes: '' }
            const ach = goal.achievements.find((a) => a.quarter === activeQuarter)
            const score = ach?.computedScore

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThrustAreaColor(goal.thrustArea)}`}>{goal.thrustArea}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{goal.title}</h3>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>UoM: {getStatusLabel(goal.uom)}</span>
                      <span>Target: <strong>{goal.target}</strong></span>
                      <span>Weightage: <strong>{goal.weightage}%</strong></span>
                    </div>
                  </div>
                  {score !== undefined && (
                    <div className="text-center">
                      <CircularProgress value={score} size={60} strokeWidth={5} label={activeQuarter} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Actual Achievement</label>
                    <input type="number" step="any" value={input.actualValue} onChange={(e) => setInput(key, 'actualValue', e.target.value)}
                      placeholder={goal.uom === 'ZERO_BASED' ? '0 = success' : `Target: ${goal.target}`} className="input" />
                    {goal.uom === 'ZERO_BASED' && <p className="text-xs text-gray-400 mt-1">Enter 0 for 100% score, any other value = 0%</p>}
                    {goal.uom === 'TIMELINE' && <p className="text-xs text-gray-400 mt-1">Enter % completion (0–100)</p>}
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select value={input.status} onChange={(e) => setInput(key, 'status', e.target.value)} className="input">
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Notes (optional)</label>
                    <input value={input.notes} onChange={(e) => setInput(key, 'notes', e.target.value)} placeholder="Any notes..." className="input" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {ach && (
                      <span className="text-xs text-gray-500">Last saved: <span className={getStatusColor(ach.status)}>{getStatusLabel(ach.status)}</span></span>
                    )}
                    {score !== undefined && score < 50 && (
                      <span className="badge-red text-xs">⚠️ At Risk — Score: {score.toFixed(1)}%</span>
                    )}
                  </div>
                  <button onClick={() => handleSave(goal.id, activeQuarter)} disabled={saving[key]}
                    className="btn-primary text-sm py-1.5">
                    {saving[key] ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><Save size={13} /> Save {activeQuarter}</>}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
