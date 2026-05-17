import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, Sparkles, Trash2, Edit2, Send, Lock, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { api } from '../../lib/api'
import { getStatusColor, getStatusLabel, getThrustAreaColor, THRUST_AREAS, UOM_OPTIONS } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import CircularProgress from '../../components/ui/CircularProgress'
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
}

interface AISuggestion {
  title: string
  description: string
  uom: string
  target: number
  unit: string
}

const defaultForm = { thrustArea: '', title: '', description: '', uom: 'NUMERIC_HIGHER', target: '', weightage: '', deadline: '' }

export default function EmployeeGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [showReturnReason, setShowReturnReason] = useState<string | null>(null)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [newComment, setNewComment] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals')
      setGoals(res.data)
    } catch { toast.error('Failed to load goals') }
    finally { setLoading(false) }
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.thrustArea) errors.thrustArea = 'Select a thrust area'
    if (!form.title.trim()) errors.title = 'Goal title is required'
    if (!form.target || isNaN(parseFloat(form.target))) errors.target = 'Valid target is required'
    if (!form.weightage || isNaN(parseFloat(form.weightage))) errors.weightage = 'Weightage is required'
    else if (parseFloat(form.weightage) < 10) errors.weightage = 'Minimum weightage is 10%'
    else if (parseFloat(form.weightage) > 100) errors.weightage = 'Maximum weightage is 100%'
    if (form.uom === 'TIMELINE' && !form.deadline) errors.deadline = 'Deadline required for Timeline goals'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editGoal) {
        const res = await api.put(`/goals/${editGoal.id}`, { ...form, target: parseFloat(form.target), weightage: parseFloat(form.weightage) })
        setGoals((prev) => prev.map((g) => g.id === editGoal.id ? { ...g, ...res.data } : g))
        toast.success('Goal updated!')
      } else {
        const res = await api.post('/goals', { ...form, target: parseFloat(form.target), weightage: parseFloat(form.weightage) })
        setGoals((prev) => [...prev, { ...res.data, achievements: [] }])
        toast.success('Goal created!')
      }
      setShowCreateModal(false)
      setEditGoal(null)
      setForm(defaultForm)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save goal')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    try {
      await api.delete(`/goals/${id}`)
      setGoals((prev) => prev.filter((g) => g.id !== id))
      toast.success('Goal deleted')
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Cannot delete goal') }
  }

  const handleSubmitAll = async () => {
    const draft = goals.filter((g) => ['DRAFT', 'RETURNED'].includes(g.status))
    const total = draft.reduce((s, g) => s + g.weightage, 0)
    if (Math.abs(total - 100) > 0.01) { toast.error(`Total weightage is ${total.toFixed(1)}%. Must equal 100%.`); return }
    if (!confirm(`Submit ${draft.length} goal(s) for manager approval?`)) return
    try {
      await api.post('/goals/submit')
      toast.success('Goals submitted for approval!')
      fetchGoals()
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Submit failed') }
  }

  const fetchAISuggestions = async () => {
    if (!form.thrustArea) { toast.error('Please select a thrust area first'); return }
    setAiLoading(true)
    try {
      const res = await api.post('/ai/suggest-goals', { thrustArea: form.thrustArea, department: 'Engineering' })
      setAiSuggestions(res.data)
      toast.success('✨ AI suggestions ready!')
    } catch { toast.error('AI suggestions failed'); setAiSuggestions([]) }
    finally { setAiLoading(false) }
  }

  const importSuggestion = (s: AISuggestion) => {
    setForm((f) => ({ ...f, title: s.title, description: s.description, uom: s.uom, target: String(s.target) }))
    setAiSuggestions([])
    toast.success('Suggestion imported!')
  }

  const fetchComments = async (goalId: string) => {
    try {
      const res = await api.get(`/comments/${goalId}`)
      setComments((prev) => ({ ...prev, [goalId]: res.data }))
    } catch {}
  }

  const addComment = async (goalId: string) => {
    if (!newComment.trim()) return
    try {
      const res = await api.post('/comments', { goalId, text: newComment })
      setComments((prev) => ({ ...prev, [goalId]: [...(prev[goalId] || []), res.data] }))
      setNewComment('')
    } catch { toast.error('Failed to add comment') }
  }

  const totalWeightage = goals.filter((g) => ['DRAFT', 'RETURNED'].includes(g.status)).reduce((s, g) => s + g.weightage, 0)
  const draftGoals = goals.filter((g) => ['DRAFT', 'RETURNED'].includes(g.status))
  const lockedGoals = goals.filter((g) => g.isLocked || g.status === 'APPROVED' || g.status === 'SUBMITTED')

  const openEdit = (goal: Goal) => {
    setEditGoal(goal)
    setForm({ thrustArea: goal.thrustArea, title: goal.title, description: goal.description || '', uom: goal.uom, target: String(goal.target), weightage: String(goal.weightage), deadline: goal.deadline ? goal.deadline.split('T')[0] : '' })
    setShowCreateModal(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Goals</h1>
          <p className="text-sm text-gray-500 mt-1">{goals.length}/8 goals · Weightage: <span className={Math.abs(totalWeightage - 100) < 0.01 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{totalWeightage.toFixed(1)}%</span> / 100%</p>
        </div>
        <div className="flex gap-2">
          {draftGoals.length > 0 && (
            <button onClick={handleSubmitAll} className="btn-primary text-sm py-2">
              <Send size={14} /> Submit for Approval
            </button>
          )}
          {goals.length < 8 && (
            <button onClick={() => { setEditGoal(null); setForm(defaultForm); setFormErrors({}); setAiSuggestions([]); setShowCreateModal(true) }} className="btn-secondary text-sm py-2">
              <Plus size={14} /> Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Draft/Returned Goals */}
      {draftGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Draft / Returned ({draftGoals.length})</h2>
          <div className="space-y-3">
            {draftGoals.map((goal) => (
              <motion.div key={goal.id} layout className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThrustAreaColor(goal.thrustArea)}`}>{goal.thrustArea}</span>
                      <span className={getStatusColor(goal.status)}>{getStatusLabel(goal.status)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{goal.title}</h3>
                    {goal.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goal.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Target: <strong>{goal.target}</strong></span>
                      <span>Weightage: <strong>{goal.weightage}%</strong></span>
                      <span>UoM: <strong>{getStatusLabel(goal.uom)}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(goal)} className="btn-ghost p-2"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(goal.id)} className="btn-ghost p-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Approved/Submitted/Locked Goals */}
      {lockedGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Goals ({lockedGoals.length})</h2>
          <div className="space-y-3">
            {lockedGoals.map((goal) => {
              const q1 = goal.achievements.find((a) => a.quarter === 'Q1')
              const isAtRisk = q1 && (q1.computedScore || 0) < 50
              const expanded = expandedGoal === goal.id
              return (
                <motion.div key={goal.id} layout className="card overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThrustAreaColor(goal.thrustArea)}`}>{goal.thrustArea}</span>
                          <span className={getStatusColor(goal.status)}>{getStatusLabel(goal.status)}</span>
                          {isAtRisk && <span className="badge-red"><AlertTriangle size={10} /> At Risk</span>}
                          {goal.isLocked && <Lock size={12} className="text-gray-400" />}
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{goal.title}</h3>
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>Target: <strong>{goal.target}</strong></span>
                          <span>Weightage: <strong>{goal.weightage}%</strong></span>
                          {q1 && <span>Q1 Score: <strong className={q1.computedScore !== undefined ? (isAtRisk ? 'text-red-600' : 'text-emerald-600') : ''}>{q1.computedScore !== undefined ? `${q1.computedScore.toFixed(1)}%` : '—'}</strong></span>}
                        </div>
                      </div>
                      {q1?.computedScore !== undefined && <CircularProgress value={q1.computedScore} size={52} strokeWidth={4} />}
                      <button onClick={() => {
                        const newExpanded = expanded ? null : goal.id
                        setExpandedGoal(newExpanded)
                        if (newExpanded) fetchComments(newExpanded)
                      }} className="btn-ghost p-2">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Comments */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-100 dark:border-zinc-800">
                        <div className="p-5">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><MessageSquare size={14} /> Comments</h4>
                          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                            {(comments[goal.id] || []).length === 0 ? (
                              <p className="text-xs text-gray-400">No comments yet</p>
                            ) : (comments[goal.id] || []).map((c: any) => (
                              <div key={c.id} className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.user.name[0]}</div>
                                <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.user.name}</span>
                                    <span className="badge-gray text-xs">{c.user.role.toLowerCase()}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addComment(goal.id)}
                              placeholder="Add a comment..." className="input flex-1 text-sm py-1.5" />
                            <button onClick={() => addComment(goal.id)} className="btn-primary px-3 py-1.5 text-sm">Post</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="card p-16 text-center">
          <Plus size={40} className="text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">No goals yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create your first goal to get started</p>
          <button onClick={() => { setEditGoal(null); setForm(defaultForm); setShowCreateModal(true) }} className="btn-primary mx-auto">
            <Plus size={16} /> Create Goal
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showCreateModal} onClose={() => { setShowCreateModal(false); setEditGoal(null); setAiSuggestions([]) }} title={editGoal ? 'Edit Goal' : 'Create New Goal'} size="lg">
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
          {/* AI Suggestions */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-violet-50 to-primary-50 dark:from-violet-950/20 dark:to-primary-950/20 border border-violet-200 dark:border-violet-800">
            <div>
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1.5"><Sparkles size={14} /> AI Goal Suggestions</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">Select a thrust area, then get AI-powered goal ideas</p>
            </div>
            <button type="button" onClick={fetchAISuggestions} disabled={aiLoading} className="btn-primary text-xs py-1.5 px-3 bg-violet-600 hover:bg-violet-700">
              {aiLoading ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : <><Sparkles size={12} /> Suggest</>}
            </button>
          </div>

          {/* AI Suggestions List */}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              {aiSuggestions.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/10">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="badge-purple">{getStatusLabel(s.uom)}</span>
                      <span className="text-xs text-gray-500">Target: {s.target} {s.unit}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => importSuggestion(s)} className="btn-primary text-xs py-1 px-2.5 flex-shrink-0">Import</button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Thrust Area *</label>
              <select value={form.thrustArea} onChange={(e) => setForm((f) => ({ ...f, thrustArea: e.target.value }))} className={`input ${formErrors.thrustArea ? 'border-red-400' : ''}`}>
                <option value="">Select thrust area...</option>
                {THRUST_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {formErrors.thrustArea && <p className="text-xs text-red-500 mt-1">{formErrors.thrustArea}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Goal Title *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Reduce API Response Time by 40%" className={`input ${formErrors.title ? 'border-red-400' : ''}`} />
              {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe this goal in detail..." rows={3} className="input resize-none" />
            </div>
            <div>
              <label className="label">Unit of Measurement *</label>
              <select value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} className="input">
                {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">{UOM_OPTIONS.find((o) => o.value === form.uom)?.description}</p>
            </div>
            <div>
              <label className="label">Target Value *</label>
              <input type="number" step="any" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} placeholder="e.g., 100" className={`input ${formErrors.target ? 'border-red-400' : ''}`} />
              {formErrors.target && <p className="text-xs text-red-500 mt-1">{formErrors.target}</p>}
            </div>
            <div>
              <label className="label">Weightage (%) * <span className="text-gray-400 font-normal">min 10%</span></label>
              <input type="number" min={10} max={100} value={form.weightage} onChange={(e) => setForm((f) => ({ ...f, weightage: e.target.value }))} placeholder="e.g., 25" className={`input ${formErrors.weightage ? 'border-red-400' : ''}`} />
              {formErrors.weightage && <p className="text-xs text-red-500 mt-1">{formErrors.weightage}</p>}
            </div>
            {form.uom === 'TIMELINE' && (
              <div>
                <label className="label">Deadline *</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className={`input ${formErrors.deadline ? 'border-red-400' : ''}`} />
                {formErrors.deadline && <p className="text-xs text-red-500 mt-1">{formErrors.deadline}</p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreateModal(false); setEditGoal(null) }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : editGoal ? <><Check size={14} /> Update Goal</> : <><Plus size={14} /> Create Goal</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
