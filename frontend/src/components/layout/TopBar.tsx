import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Sun, Moon, Menu, LogOut, User, Search, ChevronDown, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../lib/api'
import { timeAgo, getInitials } from '../../lib/utils'
import { toast } from 'sonner'

interface Notification {
  id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface TopBarProps {
  onToggleSidebar: () => void
}

const DEMO_USERS = [
  { email: 'admin@atomquest.com', password: 'admin123', role: 'Admin', color: 'text-red-500' },
  { email: 'manager1@atomquest.com', password: 'manager123', role: 'Manager', color: 'text-amber-500' },
  { email: 'employee1@atomquest.com', password: 'emp123', role: 'Employee', color: 'text-primary-500' },
]

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout, login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {}
  }

  const switchRole = async (email: string, password: string) => {
    try {
      await login(email, password)
      setShowRoleSwitcher(false)
      toast.success('Role switched successfully')
      navigate('/')
    } catch {
      toast.error('Failed to switch role')
    }
  }

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = { GOAL_APPROVED: '✅', GOAL_RETURNED: '🔄', GOAL_SUBMITTED: '📤', NUDGE: '⚠️', ESCALATION: '🚨', CHECKIN_REMINDER: '🔔', SHARED_GOAL: '🤝' }
    return icons[type] || '📬'
  }

  return (
    <header className="h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 gap-3 flex-shrink-0 z-30">
      {/* Sidebar toggle */}
      <button onClick={onToggleSidebar} className="btn-ghost p-2 -ml-1" aria-label="Toggle sidebar">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="global-search"
          type="text"
          placeholder="Search... (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-zinc-900 rounded-lg outline-none transition-all duration-150 text-gray-700 dark:text-gray-300 placeholder-gray-400"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Role Switcher (Demo) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="btn-ghost px-2.5 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg"
          >
            <Zap size={12} />
            <span className="hidden sm:inline">Switch Role</span>
          </button>
          <AnimatePresence>
            {showRoleSwitcher && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-10 w-56 card shadow-lg p-2 z-50">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 pb-1.5">Quick Demo Login</p>
                {DEMO_USERS.map((u) => (
                  <button key={u.email} onClick={() => switchRole(u.email, u.password)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors ${u.email === user?.email ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${u.color.replace('text', 'bg')}`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{u.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{u.email}</p>
                    </div>
                    {u.email === user?.email && <span className="ml-auto text-xs text-primary-500">Active</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button onClick={toggle} className="btn-ghost p-2" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="btn-ghost p-2 relative" aria-label="Notifications">
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-10 w-80 card shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors ${!n.isRead ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''}`}>
                        <div className="flex gap-2.5">
                          <span className="text-base flex-shrink-0 mt-0.5">{getNotifIcon(n.type)}</span>
                          <div className="min-w-0">
                            <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {user ? getInitials(user.name) : '?'}
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>
          <AnimatePresence>
            {showUserMenu && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-10 w-48 card shadow-lg p-1.5 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 mb-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button onClick={() => { setShowUserMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-md">
                  <User size={14} /> Profile
                </button>
                <button onClick={() => { logout(); navigate('/login'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md">
                  <LogOut size={14} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside overlay */}
      {(showNotifs || showUserMenu || showRoleSwitcher) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifs(false); setShowUserMenu(false); setShowRoleSwitcher(false) }} />
      )}
    </header>
  )
}
