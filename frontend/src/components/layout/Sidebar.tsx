import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Target, CheckSquare, Users, BarChart3,
  Settings, Shield, GitBranch, AlertTriangle, FileText,
  Share2, ChevronRight, Atom
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles: string[]
}

const navItems: NavItem[] = [
  // Employee
  { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['EMPLOYEE'] },
  { to: '/employee/goals', icon: Target, label: 'My Goals', roles: ['EMPLOYEE'] },
  { to: '/employee/checkin', icon: CheckSquare, label: 'Check-in', roles: ['EMPLOYEE'] },

  // Manager
  { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['MANAGER'] },
  { to: '/manager/team-goals', icon: Target, label: 'Team Goals', roles: ['MANAGER'] },
  { to: '/manager/checkins', icon: CheckSquare, label: 'Check-ins', roles: ['MANAGER'] },

  // Admin
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/admin/cycles', icon: Settings, label: 'Cycle Config', roles: ['ADMIN'] },
  { to: '/admin/org', icon: GitBranch, label: 'Org Hierarchy', roles: ['ADMIN'] },
  { to: '/admin/escalations', icon: AlertTriangle, label: 'Escalations', roles: ['ADMIN'] },
  { to: '/admin/audit', icon: FileText, label: 'Audit Trail', roles: ['ADMIN'] },
  { to: '/admin/shared-goals', icon: Share2, label: 'Shared Goals', roles: ['ADMIN'] },

  // All roles
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-glow">
          <Atom className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              <span className="font-bold text-gray-900 dark:text-white text-sm leading-tight">AtomQuest</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined}>
              {({ isActive: linkActive }) => (
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                    linkActive || isActive
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && (linkActive || isActive) && (
                    <ChevronRight size={14} className="ml-auto opacity-50" />
                  )}
                </motion.div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Role Badge */}
      {!collapsed && user && (
        <div className="p-3 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
              user.role === 'ADMIN' ? 'bg-red-500' : user.role === 'MANAGER' ? 'bg-amber-500' : 'bg-primary-500'
            )}>
              {user.role === 'ADMIN' ? <Shield size={12} /> : user.role === 'MANAGER' ? <Users size={12} /> : user.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
