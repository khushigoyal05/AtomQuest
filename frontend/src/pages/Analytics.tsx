import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, PieChart as PieIcon, Download } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { toast } from 'sonner'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

export default function Analytics() {
  const { user } = useAuth()
  const [overview, setOverview] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [thrustAreas, setThrustAreas] = useState<any[]>([])
  const [uomDist, setUomDist] = useState<any[]>([])
  const [managerData, setManagerData] = useState<any[]>([])
  const [employeeTrend, setEmployeeTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const promises: Promise<any>[] = [
        api.get('/analytics/overview'),
        api.get('/analytics/department'),
        api.get('/analytics/thrust-areas'),
        api.get('/analytics/uom'),
      ]
      if (user?.role !== 'EMPLOYEE') {
        promises.push(api.get('/analytics/manager-effectiveness'))
      }
      if (user?.id) {
        promises.push(api.get(`/analytics/employee/${user.id}`))
      }

      const results = await Promise.all(promises)
      setOverview(results[0].data)
      setDepartments(results[1].data)
      setThrustAreas(results[2].data)
      setUomDist(results[3].data)
      if (user?.role !== 'EMPLOYEE') setManagerData(results[4]?.data || [])
      const trend = user?.role !== 'EMPLOYEE' ? results[5]?.data?.trend : results[4]?.data?.trend
      setEmployeeTrend(trend || [])
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const exportChart = async () => {
    if (!chartRef.current) return
    try {
      const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js' as any)
      const canvas = await html2canvas(chartRef.current)
      const a = document.createElement('a')
      a.download = 'AtomQuest_Analytics.png'
      a.href = canvas.toDataURL()
      a.click()
    } catch {
      toast.info('PNG export: right-click on a chart and save as image')
    }
  }

  const UOM_LABELS: Record<string, string> = { NUMERIC_HIGHER: 'Higher Better', NUMERIC_LOWER: 'Lower Better', TIMELINE: 'Timeline', ZERO_BASED: 'Zero-Based' }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto" ref={chartRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Performance insights across the organization</p>
        </div>
        <button onClick={exportChart} className="btn-secondary text-sm py-2"><Download size={14} /> Export PNG</button>
      </div>

      {/* QoQ Trend */}
      {employeeTrend.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2"><TrendingUp size={16} /> Quarter-on-Quarter Score Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={employeeTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: any) => [`${v?.toFixed(1)}%`, 'Avg Score']} />
              <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Distribution by Thrust Area */}
        {thrustAreas.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-5">
            <h2 className="section-title mb-4 flex items-center gap-2"><PieIcon size={16} /> Goals by Thrust Area</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={thrustAreas} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                    {thrustAreas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {thrustAreas.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* UoM Distribution */}
        {uomDist.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="card p-5">
            <h2 className="section-title mb-4">Goals by Measurement Type</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={uomDist.map((d) => ({ ...d, name: UOM_LABELS[d.name] || d.name }))} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                    {uomDist.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Department Heatmap */}
      {departments.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2"><BarChart3 size={16} /> Department Performance Heatmap</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departments} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="department" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="avgScore" name="Avg Score %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approvedGoals" name="Approved Goals" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Manager Effectiveness Table */}
      {managerData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="card p-5">
          <h2 className="section-title mb-4">Manager Effectiveness</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-900">
                <tr>
                  <th className="table-th">Manager</th>
                  <th className="table-th">Team Size</th>
                  <th className="table-th">Total Goals</th>
                  <th className="table-th">Check-in Rate</th>
                  <th className="table-th">Avg Team Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {managerData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50">
                    <td className="table-td font-medium">{row.manager.name}</td>
                    <td className="table-td">{row.teamSize}</td>
                    <td className="table-td">{row.totalGoals}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${row.checkinRate}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{row.checkinRate}%</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`font-semibold ${row.avgTeamScore >= 70 ? 'text-emerald-600' : row.avgTeamScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {row.avgTeamScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
