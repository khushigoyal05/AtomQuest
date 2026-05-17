import { useState, useEffect } from 'react'
import { Share2, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { THRUST_AREAS, UOM_OPTIONS, getStatusLabel } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import { toast } from 'sonner'

interface User { id: string; name: string; email: string; role: string; department: string }

export default function SharedGoals() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ thrustArea: '', title: '', description: '', uom: 'NUMERIC_HIGHER', target: '', weightage: '20', recipientIds: [] as string[] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/users').then((r) => setUsers(r.data.filter((u: User) => u.role === 'EMPLOYEE'))).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false))
  }, [])

  const toggleRecipient = (id: string) => {
    setForm((f) => ({ ...f, recipientIds: f.recipientIds.includes(id) ? f.recipientIds.filter((r) => r !== id) : [...f.recipientIds, id] }))
  }

  const handlePush = async () => {
    if (!form.title || !form.thrustArea || !form.target || form.recipientIds.length === 0) {
      toast.error('Please fill all fields and select at least one recipient')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/shared-goals', { ...form, target: parseFloat(form.target), weightage: parseFloat(form.weightage) })
      toast.success(`Shared goal pushed to ${form.recipientIds.length} employee(s)!`)
      setShowModal(false)
      setForm({ thrustArea: '', title: '', description: '', uom: 'NUMERIC_HIGHER', target: '', weightage: '20', recipientIds: [] })
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Push failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="text-gray-500" size={22} />
          <div>
            <h1 className="page-title">Shared Goals</h1>
            <p className="text-sm text-gray-500">Push organizational goals to multiple employees</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2">
          <Plus size={14} /> Push Shared Goal
        </button>
      </div>

      <div className="card p-8 text-center">
        <Share2 size={40} className="text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">Push Goals to Your Team</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">Shared goals are pushed to selected employees. The title and target are read-only for recipients — only weightage is adjustable.</p>
        <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
          <Plus size={16} /> Create Shared Goal
        </button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Push Shared Goal" size="lg">
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
            ⚠️ Shared goals are pushed as APPROVED and locked. Recipients can only adjust their weightage.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Thrust Area *</label>
              <select value={form.thrustArea} onChange={(e) => setForm((f) => ({ ...f, thrustArea: e.target.value }))} className="input">
                <option value="">Select...</option>
                {THRUST_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">UoM *</label>
              <select value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} className="input">
                {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Goal Title *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Achieve Zero Safety Incidents" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input resize-none" />
            </div>
            <div>
              <label className="label">Target *</label>
              <input type="number" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Default Weightage (%)</label>
              <input type="number" min={10} max={50} value={form.weightage} onChange={(e) => setForm((f) => ({ ...f, weightage: e.target.value }))} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Select Recipients * ({form.recipientIds.length} selected)</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {users.map((u) => (
                <label key={u.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.recipientIds.includes(u.id) ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={form.recipientIds.includes(u.id)} onChange={() => toggleRecipient(u.id)} className="w-4 h-4 text-primary-600 rounded" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.department}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handlePush} disabled={saving} className="btn-primary flex-1">
              {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><Share2 size={14} /> Push to {form.recipientIds.length} Employee(s)</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
