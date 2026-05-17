import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { formatDate, timeAgo, getStatusColor } from '../../lib/utils'
import DataTable from '../../components/ui/DataTable'
import { toast } from 'sonner'

interface Escalation {
  id: string
  ruleType: string
  status: string
  message: string
  triggeredAt: string
  resolvedAt?: string
  triggeredFor: { name: string; email: string; role: string }
}

export default function Escalations() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => { fetchEscalations() }, [])

  const fetchEscalations = async () => {
    try {
      const res = await api.get('/admin/escalations')
      setEscalations(res.data)
    } catch { toast.error('Failed to load escalations') }
    finally { setLoading(false) }
  }

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await api.put(`/admin/escalations/${id}/resolve`)
      setEscalations((prev) => prev.map((e) => e.id === id ? { ...e, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : e))
      toast.success('Escalation resolved!')
    } catch { toast.error('Failed to resolve') }
    finally { setResolving(null) }
  }

  const pending = escalations.filter((e) => e.status === 'PENDING').length
  const resolved = escalations.filter((e) => e.status === 'RESOLVED').length

  const columns = [
    { key: 'triggeredAt', header: 'Triggered', render: (e: Escalation) => <span className="text-xs text-gray-500">{timeAgo(e.triggeredAt)}</span> },
    { key: 'triggeredFor', header: 'For', render: (e: Escalation) => (
      <div>
        <p className="font-medium text-sm">{e.triggeredFor.name}</p>
        <p className="text-xs text-gray-500 capitalize">{e.triggeredFor.role.toLowerCase()}</p>
      </div>
    )},
    { key: 'ruleType', header: 'Rule Type', render: (e: Escalation) => (
      <span className="badge-amber text-xs">{e.ruleType.replace('_', ' ')}</span>
    )},
    { key: 'message', header: 'Message', render: (e: Escalation) => <span className="text-sm">{e.message}</span> },
    { key: 'status', header: 'Status', render: (e: Escalation) => (
      <span className={e.status === 'PENDING' ? 'badge-amber' : 'badge-green'}>{e.status}</span>
    )},
    { key: 'actions', header: '', sortable: false, render: (e: Escalation) => (
      e.status === 'PENDING' ? (
        <button onClick={() => handleResolve(e.id)} disabled={resolving === e.id} className="btn-primary text-xs py-1 px-2.5">
          {resolving === e.id ? <span className="animate-spin rounded-full h-3 w-3 border-b border-white" /> : <><CheckCircle2 size={12} /> Resolve</>}
        </button>
      ) : <span className="text-xs text-gray-400">{e.resolvedAt ? formatDate(e.resolvedAt) : '—'}</span>
    )},
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-amber-500" size={22} />
        <div>
          <h1 className="page-title">Escalations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and resolve escalated issues</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Total</p>
          <p className="text-2xl font-bold">{escalations.length}</p>
        </div>
        <div className="stat-card border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 font-semibold uppercase mb-2">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="stat-card border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 font-semibold uppercase mb-2">Resolved</p>
          <p className="text-2xl font-bold text-emerald-600">{resolved}</p>
        </div>
      </div>

      <div className="card p-5">
        <DataTable data={escalations} columns={columns} loading={loading} searchKeys={['message', 'ruleType']} emptyMessage="No escalations found" />
      </div>
    </div>
  )
}
