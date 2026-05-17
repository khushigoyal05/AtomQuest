import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Calendar, Plus, Edit2, Check, X } from 'lucide-react'
import { api } from '../../lib/api'
import { getStatusLabel, formatDate } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import { toast } from 'sonner'

interface Cycle {
  id: string
  phaseName: string
  label: string
  opensAt: string
  closesAt: string
  isActive: boolean
  year: number
}

const PHASES = ['GOAL_SETTING', 'Q1_CHECKIN', 'Q2_CHECKIN', 'Q3_CHECKIN', 'Q4_ANNUAL']

export default function CycleConfig() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{ open: boolean; cycle: Cycle | null }>({ open: false, cycle: null })
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ phaseName: 'GOAL_SETTING', label: '', opensAt: '', closesAt: '', isActive: false, year: 2026 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCycles() }, [])

  const fetchCycles = async () => {
    try {
      const res = await api.get('/admin/cycles')
      setCycles(res.data)
    } catch { toast.error('Failed to load cycles') }
    finally { setLoading(false) }
  }

  const handleSaveEdit = async () => {
    if (!editModal.cycle) return
    setSaving(true)
    try {
      const { label, opensAt, closesAt, isActive } = form
      await api.put(`/admin/cycles/${editModal.cycle.id}`, { label, opensAt, closesAt, isActive })
      toast.success('Cycle updated!')
      setEditModal({ open: false, cycle: null })
      fetchCycles()
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Update failed') }
    finally { setSaving(false) }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await api.post('/admin/cycles', form)
      toast.success('Cycle created!')
      setCreateModal(false)
      setForm({ phaseName: 'GOAL_SETTING', label: '', opensAt: '', closesAt: '', isActive: false, year: 2026 })
      fetchCycles()
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Create failed') }
    finally { setSaving(false) }
  }

  const openEdit = (cycle: Cycle) => {
    setForm({ phaseName: cycle.phaseName, label: cycle.label, opensAt: cycle.opensAt.split('T')[0], closesAt: cycle.closesAt.split('T')[0], isActive: cycle.isActive, year: cycle.year })
    setEditModal({ open: true, cycle })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cycle Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage goal-setting and check-in phase windows</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary text-sm py-2">
          <Plus size={14} /> Add Cycle
        </button>
      </div>

      <div className="space-y-3">
        {cycles.map((cycle, i) => (
          <motion.div key={cycle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`card p-5 ${cycle.isActive ? 'border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-950/10' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cycle.isActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                <Calendar size={18} className={cycle.isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{cycle.label}</h3>
                  {cycle.isActive && (
                    <span className="badge-green flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>Phase: {getStatusLabel(cycle.phaseName)}</span>
                  <span>Opens: {formatDate(cycle.opensAt)}</span>
                  <span>Closes: {formatDate(cycle.closesAt)}</span>
                  <span>Year: {cycle.year}</span>
                </div>
              </div>
              <button onClick={() => openEdit(cycle)} className="btn-ghost p-2"><Edit2 size={14} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, cycle: null })} title="Edit Cycle">
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Label</label>
            <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Opens At</label>
              <input type="date" value={form.opensAt} onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Closes At</label>
              <input type="date" value={form.closesAt} onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))} className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as Active Cycle</span>
          </label>
          {form.isActive && <p className="text-xs text-amber-600">⚠️ Setting this as active will deactivate all other cycles.</p>}
          <div className="flex gap-3">
            <button onClick={() => setEditModal({ open: false, cycle: null })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary flex-1">
              {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Cycle">
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Phase</label>
            <select value={form.phaseName} onChange={(e) => setForm((f) => ({ ...f, phaseName: e.target.value }))} className="input">
              {PHASES.map((p) => <option key={p} value={p}>{getStatusLabel(p)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Label</label>
            <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g., Q1 Check-in 2026" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Opens At</label>
              <input type="date" value={form.opensAt} onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Closes At</label>
              <input type="date" value={form.closesAt} onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) }))} className="input" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as Active Cycle</span>
          </label>
          <div className="flex gap-3">
            <button onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.label || !form.opensAt || !form.closesAt} className="btn-primary flex-1">
              {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><Plus size={14} /> Create</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
