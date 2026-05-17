import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Edit2, ChevronDown, ChevronUp, AlertTriangle, Lock } from 'lucide-react'
import { api } from '../../lib/api'
import { getStatusColor, getStatusLabel, getThrustAreaColor, getInitials } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import CircularProgress from '../../components/ui/CircularProgress'
import { toast } from 'sonner'

interface Goal {
  id: string
  employeeId: string
  thrustArea: string
  title: string
  description?: string
  uom: string
  target: number
  weightage: number
  status: string
  isLocked: boolean
  employee: { id: string; name: string; email: string; department: string }
  achievements: { quarter: string; actualValue?: number; computedScore?: number; status: string }[]
}

export default function ManagerTeamGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [returnModal, setReturnModal] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null })
  const [returnReason, setReturnReason] = useState('')
  const [editModal, setEditModal] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null })
  const [editTarget, setEditTarget] = useState('')
  const [editWeightage, setEditWeightage] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals/manager/team')
      setGoals(res.data.goals)
    } catch { toast.error('Failed to load goals') }
    finally { setLoading(false) }
  }

  const handleApprove = async (goalId: string) => {
    setProcessing(goalId)
    try {
      await api.post(`/goals/${goalId}/approve`)
      setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, status: 'APPROVED', isLocked: true } : g))
      toast.success('Goal approved!')
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Approval failed') }
    finally { setProcessing(null) }
  }

  const handleReturn = async () => {
    if (!returnReason.trim()) { toast.error('Please provide a rejection reason'); return }
    setProcessing(returnModal.goalId!)
    try {
      await api.post(`/goals/${returnModal.goalId}/return`, { reason: returnReason })
      setGoals((prev) => prev.map((g) => g.id === returnModal.goalId ? { ...g, status: 'RETURNED' } : g))
      setReturnModal({ open: false, goalId: null })
      setReturnReason('')
      toast.success('Goal returned for rework')
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Return failed') }
    finally { setProcessing(null) }
  }

  const handleEditSave = async () => {
    if (!editModal.goal) return
    setProcessing(editModal.goal.id)
    try {
      await api.put(`/goals/${editModal.goal.id}`, { target: parseFloat(editTarget), weightage: parseFloat(editWeightage) })
      setGoals((prev) => prev.map((g) => g.id === editModal.goal!.id ? { ...g, target: parseFloat(editTarget), weightage: parseFloat(editWeightage) } : g))
      setEditModal({ open: false, goal: null })
      toast.success('Goal updated!')
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Update failed') }
    finally { setProcessing(null) }
  }

  const employeeIds = [...new Set(goals.map((g) => g.employeeId))]
  const filteredGoals = filterStatus === 'ALL' ? goals : goals.filter((g) => g.status === filterStatus)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Team Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve your team's goal sheets</p>
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-auto text-sm py-1.5">
          <option value="ALL">All Status</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="DRAFT">Draft</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {['SUBMITTED', 'APPROVED', 'RETURNED', 'DRAFT'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'ALL' : s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${filterStatus === s ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400' : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
            <span className={getStatusColor(s)}>{getStatusLabel(s)}</span>
            <span className="bg-gray-100 dark:bg-zinc-800 px-1.5 rounded text-xs">{goals.filter((g) => g.status === s).length}</span>
          </button>
        ))}
      </div>

      {/* Goals by Employee */}
      {employeeIds.map((empId) => {
        const empGoals = filteredGoals.filter((g) => g.employeeId === empId)
        if (empGoals.length === 0) return null
        const emp = empGoals[0]?.employee
        const expanded = expandedEmployee === empId
        const hasPending = empGoals.some((g) => g.status === 'SUBMITTED')

        return (
          <motion.div key={empId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
            <button className="w-full flex items-center gap-3 p-5 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
              onClick={() => setExpandedEmployee(expanded ? null : empId)}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {emp && getInitials(emp.name)}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{emp?.name}</p>
                <p className="text-xs text-gray-500">{emp?.email} · {empGoals.length} goals</p>
              </div>
              {hasPending && <span className="badge-amber">Pending Review</span>}
              {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {expanded && (
              <div className="border-t border-gray-100 dark:border-zinc-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-900">
                      <tr>
                        <th className="table-th">Goal</th>
                        <th className="table-th">Thrust Area</th>
                        <th className="table-th">UoM</th>
                        <th className="table-th">Target</th>
                        <th className="table-th">Weightage</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Q1 Score</th>
                        <th className="table-th">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {empGoals.map((goal) => {
                        const q1 = goal.achievements.find((a) => a.quarter === 'Q1')
                        const isAtRisk = q1 && (q1.computedScore || 0) < 50
                        return (
                          <tr key={goal.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40">
                            <td className="table-td">
                              <div className="flex items-center gap-2">
                                {goal.isLocked && <Lock size={12} className="text-gray-400" />}
                                <span className="font-medium">{goal.title}</span>
                                {isAtRisk && <AlertTriangle size={12} className="text-red-500" />}
                              </div>
                            </td>
                            <td className="table-td">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThrustAreaColor(goal.thrustArea)}`}>{goal.thrustArea}</span>
                            </td>
                            <td className="table-td text-xs">{getStatusLabel(goal.uom)}</td>
                            <td className="table-td">{goal.target}</td>
                            <td className="table-td">{goal.weightage}%</td>
                            <td className="table-td"><span className={getStatusColor(goal.status)}>{getStatusLabel(goal.status)}</span></td>
                            <td className="table-td">
                              {q1?.computedScore !== undefined ? (
                                <span className={isAtRisk ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>{q1.computedScore.toFixed(1)}%</span>
                              ) : '—'}
                            </td>
                            <td className="table-td">
                              <div className="flex gap-1">
                                {goal.status === 'SUBMITTED' && (
                                  <>
                                    <button onClick={() => handleApprove(goal.id)} disabled={!!processing} title="Approve"
                                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 transition-colors">
                                      {processing === goal.id ? <span className="animate-spin rounded-full h-3 w-3 border-b border-emerald-600 block" /> : <Check size={14} />}
                                    </button>
                                    <button onClick={() => setReturnModal({ open: true, goalId: goal.id })} disabled={!!processing} title="Return"
                                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 transition-colors">
                                      <X size={14} />
                                    </button>
                                  </>
                                )}
                                {goal.status === 'SUBMITTED' && (
                                  <button onClick={() => { setEditModal({ open: true, goal }); setEditTarget(String(goal.target)); setEditWeightage(String(goal.weightage)) }} title="Edit"
                                    className="p-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-600 hover:bg-gray-100 transition-colors">
                                    <Edit2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )
      })}

      {filteredGoals.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400">No goals found for the selected filter</p>
        </div>
      )}

      {/* Return Modal */}
      <Modal open={returnModal.open} onClose={() => setReturnModal({ open: false, goalId: null })} title="Return Goal for Rework">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Please provide a reason for returning this goal. The employee will be notified.</p>
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={4} placeholder="e.g., Please adjust weightage to match team priorities..." className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setReturnModal({ open: false, goalId: null })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleReturn} disabled={!!processing} className="btn-danger flex-1">
              {processing ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><X size={14} /> Return Goal</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, goal: null })} title="Edit Goal (Manager Review)">
        <div className="p-6 space-y-4">
          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            ⚠️ You are editing this goal during review. Changes will be saved before approval.
          </p>
          <div>
            <label className="label">Target Value</label>
            <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Weightage (%)</label>
            <input type="number" min={10} max={100} value={editWeightage} onChange={(e) => setEditWeightage(e.target.value)} className="input" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditModal({ open: false, goal: null })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleEditSave} disabled={!!processing} className="btn-primary flex-1">
              {processing ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
