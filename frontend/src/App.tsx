import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useKeyboardShortcuts } from './lib/shortcuts'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

// Employee pages
import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeGoals from './pages/employee/Goals'
import EmployeeCheckIn from './pages/employee/CheckIn'

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerTeamGoals from './pages/manager/TeamGoals'
import ManagerCheckIns from './pages/manager/CheckIns'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminCycles from './pages/admin/CycleConfig'
import AdminOrgHierarchy from './pages/admin/OrgHierarchy'
import AdminAuditLog from './pages/admin/AuditLog'
import AdminEscalations from './pages/admin/Escalations'
import AdminSharedGoals from './pages/admin/SharedGoals'

// Shared
import Analytics from './pages/Analytics'

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />
  if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  useKeyboardShortcuts()
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <RoleRedirect /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleRedirect />} />

        {/* Employee */}
        <Route path="employee/dashboard" element={<ProtectedRoute roles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="employee/goals" element={<ProtectedRoute roles={['EMPLOYEE']}><EmployeeGoals /></ProtectedRoute>} />
        <Route path="employee/checkin" element={<ProtectedRoute roles={['EMPLOYEE']}><EmployeeCheckIn /></ProtectedRoute>} />

        {/* Manager */}
        <Route path="manager/dashboard" element={<ProtectedRoute roles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="manager/team-goals" element={<ProtectedRoute roles={['MANAGER']}><ManagerTeamGoals /></ProtectedRoute>} />
        <Route path="manager/checkins" element={<ProtectedRoute roles={['MANAGER']}><ManagerCheckIns /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/cycles" element={<ProtectedRoute roles={['ADMIN']}><AdminCycles /></ProtectedRoute>} />
        <Route path="admin/org" element={<ProtectedRoute roles={['ADMIN']}><AdminOrgHierarchy /></ProtectedRoute>} />
        <Route path="admin/audit" element={<ProtectedRoute roles={['ADMIN']}><AdminAuditLog /></ProtectedRoute>} />
        <Route path="admin/escalations" element={<ProtectedRoute roles={['ADMIN']}><AdminEscalations /></ProtectedRoute>} />
        <Route path="admin/shared-goals" element={<ProtectedRoute roles={['ADMIN']}><AdminSharedGoals /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
