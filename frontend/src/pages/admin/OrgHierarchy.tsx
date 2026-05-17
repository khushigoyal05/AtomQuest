import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Edit2 } from 'lucide-react'
import { api } from '../../lib/api'
import { getInitials } from '../../lib/utils'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  managerId?: string
  manager?: { id: string; name: string }
  directReports: { id: string; name: string; role: string }[]
}

export default function OrgHierarchy() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [newManagerId, setNewManagerId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const handleUpdateManager = async () => {
    if (!editModal.user) return
    setSaving(true)
    try {
      await api.put(`/admin/users/${editModal.user.id}/manager`, { managerId: newManagerId || null })
      toast.success('Manager updated!')
      setEditModal({ open: false, user: null })
      fetchUsers()
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const managers = users.filter((u) => u.role === 'MANAGER')
  const employees = users.filter((u) => u.role === 'EMPLOYEE')

  const columns = [
    { key: 'name', header: 'Name', render: (u: User) => (
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-500' : u.role === 'MANAGER' ? 'bg-amber-500' : 'bg-primary-500'}`}>
          {getInitials(u.name)}
        </div>
        <span className="font-medium">{u.name}</span>
      </div>
    )},
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u: User) => (
      <span className={`badge-${u.role === 'ADMIN' ? 'red' : u.role === 'MANAGER' ? 'amber' : 'blue'}`}>{u.role}</span>
    )},
    { key: 'department', header: 'Department' },
    { key: 'manager', header: 'Reports To', render: (u: User) => u.manager?.name || '—' },
    { key: 'directReports', header: 'Direct Reports', render: (u: User) => u.directReports?.length || 0 },
    { key: 'actions', header: '', sortable: false, render: (u: User) => (
      u.role === 'EMPLOYEE' ? (
        <button onClick={() => { setEditModal({ open: true, user: u }); setNewManagerId(u.managerId || '') }} className="btn-ghost p-1.5">
          <Edit2 size={13} />
        </button>
      ) : null
    )},
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="page-title">Org Hierarchy</h1>
        <p className="text-sm text-gray-500 mt-1">Manage employee–manager reporting relationships</p>
      </div>

      {/* Hierarchy Visual */}
      <div className="card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2"><GitBranch size={16} /> Reporting Structure</h2>
        <div className="space-y-4">
          {managers.map((mgr) => (
            <div key={mgr.id} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(mgr.name)}</div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{mgr.name}</p>
                  <p className="text-xs text-gray-500">{mgr.email} · {mgr.department}</p>
                </div>
              </div>
              <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-zinc-700 space-y-2">
                {employees.filter((e) => e.managerId === mgr.id).map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(emp.name)}</div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{emp.name}</span>
                    <span className="text-xs text-gray-400">{emp.department}</span>
                  </div>
                ))}
                {employees.filter((e) => e.managerId === mgr.id).length === 0 && (
                  <p className="text-xs text-gray-400 italic">No direct reports</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Table */}
      <div className="card p-5">
        <h2 className="section-title mb-4">All Users</h2>
        <DataTable data={users} columns={columns} loading={loading} searchKeys={['name', 'email', 'department', 'role']} />
      </div>

      {/* Edit Manager Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, user: null })} title={`Update Manager — ${editModal.user?.name}`}>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Select the manager for this employee:</p>
          <div>
            <label className="label">Reports To</label>
            <select value={newManagerId} onChange={(e) => setNewManagerId(e.target.value)} className="input">
              <option value="">— No Manager —</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.department})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditModal({ open: false, user: null })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpdateManager} disabled={saving} className="btn-primary flex-1">
              {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
