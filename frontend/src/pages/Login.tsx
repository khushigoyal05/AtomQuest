import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Atom, Eye, EyeOff, Zap, Target, BarChart3, Shield, Users, CheckCircle, ArrowRight, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

const QUICK_LOGINS = [
  { role: 'Admin / HR', email: 'admin@atomquest.com', password: 'admin123', icon: Shield, color: 'from-red-500 to-rose-600', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', desc: 'Full system access, cycle config, audit trail' },
  { role: 'Manager L1', email: 'manager1@atomquest.com', password: 'manager123', icon: Users, color: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', desc: 'Approve goals, check-ins, team dashboard' },
  { role: 'Employee', email: 'employee1@atomquest.com', password: 'emp123', icon: Target, color: 'from-primary-500 to-violet-600', badge: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400', desc: 'Set goals, log achievements, track progress' },
]

const FEATURES = [
  { icon: Target, text: 'Smart Goal Setting with AI Suggestions' },
  { icon: BarChart3, text: 'Real-time Progress Analytics' },
  { icon: CheckCircle, text: 'Quarterly Check-in Management' },
  { icon: Shield, text: 'Enterprise-grade Audit Trail' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingQuick, setLoadingQuick] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (ql: typeof QUICK_LOGINS[0]) => {
    setLoadingQuick(ql.email)
    try {
      await login(ql.email, ql.password)
      toast.success(`Logged in as ${ql.role}`)
      navigate('/')
    } catch {
      toast.error('Quick login failed')
    } finally {
      setLoadingQuick(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-zinc-950">
      {/* Left — Hero */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 p-12 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Atom className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AtomQuest</h1>
              <p className="text-primary-200 text-xs">Goal Setting & Tracking Portal</p>
            </div>
          </div>
        </motion.div>

        {/* Hero Content */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Drive Performance<br />with Purpose
          </h2>
          <p className="text-primary-200 text-lg mb-8 leading-relaxed">
            Align your team's goals with organizational objectives. Track progress in real-time and celebrate achievements together.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <f.icon size={14} />
                </div>
                <span className="text-sm font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="relative z-10 grid grid-cols-3 gap-4">
          {[{ v: '6', l: 'Employees' }, { v: '3', l: 'Roles' }, { v: '100%', l: 'Feature Complete' }].map((s, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{s.v}</p>
              <p className="text-xs text-primary-200 mt-0.5">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <Atom className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">AtomQuest</h1>
            <p className="text-xs text-gray-500">Goal Setting & Tracking</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Enter your credentials or use a quick login below</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="label">Email address</label>
              <input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-2.5 mt-2">
              {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <>Sign in <ArrowRight size={16} /></>}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
            <span className="text-xs text-gray-400 flex items-center gap-1.5"><Zap size={11} /> Quick Demo Login</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
          </div>

          {/* Quick Login Cards */}
          <div className="space-y-2.5">
            {QUICK_LOGINS.map((ql) => {
              const Icon = ql.icon
              const isLoading = loadingQuick === ql.email
              return (
                <motion.button key={ql.email} onClick={() => handleQuickLogin(ql)} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} disabled={!!loadingQuick}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all duration-150 group bg-white dark:bg-zinc-900">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ql.color} flex items-center justify-center flex-shrink-0`}>
                    {isLoading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Icon size={16} className="text-white" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{ql.role}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ql.badge}`}>{ql.email.split('@')[0]}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{ql.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock size={11} />
                    <span className="text-xs">{ql.password}</span>
                    <ArrowRight size={14} className="group-hover:text-primary-500 transition-colors" />
                  </div>
                </motion.button>
              )
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            AtomQuest v1.0 — Hackathon Edition · All rights reserved
          </p>
        </motion.div>
      </div>
    </div>
  )
}
