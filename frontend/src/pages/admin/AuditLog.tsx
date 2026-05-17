import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/utils'
import DataTable from '../../components/ui/DataTable'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  changedById: string
  changeDescription: string
  oldValue?: string
  newValue?: string
  changedAt: string
  changedBy: { name: string; email: string; role: string }
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/audit').then((r) => setLogs(r.data)).catch(() => toast.error('Failed to load audit log')).finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'changedAt', header: 'Timestamp', render: (l: AuditLog) => <span className="text-xs">{formatDateTime(l.changedAt)}</span> },
    { key: 'changedBy', header: 'Changed By', render: (l: AuditLog) => (
      <div>
        <p className="font-medium text-sm">{l.changedBy.name}</p>
        <p className="text-xs text-gray-500">{l.changedBy.role.toLowerCase()}</p>
      </div>
    )},
    { key: 'entityType', header: 'Entity', render: (l: AuditLog) => <span className="badge-blue capitalize">{l.entityType}</span> },
    { key: 'changeDescription', header: 'Change', render: (l: AuditLog) => <span className="text-sm">{l.changeDescription}</span> },
    { key: 'oldValue', header: 'Old Value', render: (l: AuditLog) => l.oldValue ? <span className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">{l.oldValue}</span> : <span className="text-gray-300">—</span> },
    { key: 'newValue', header: 'New Value', render: (l: AuditLog) => l.newValue ? <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">{l.newValue}</span> : <span className="text-gray-300">—</span> },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <FileText className="text-gray-500" size={22} />
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete log of who changed what and when</p>
        </div>
      </div>
      <div className="card p-5">
        <DataTable data={logs} columns={columns} loading={loading} searchKeys={['changeDescription', 'entityType']} emptyMessage="No audit logs found" />
      </div>
    </div>
  )
}
