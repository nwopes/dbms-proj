import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, ResponsiveContainer, Legend } from 'recharts'
import api from '../api'
import { fmtDate, statusBadge } from '../utils'
import CrimeMap from '../components/CrimeMap'

const CHART_COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0abfc', '#c084fc']

function StatCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-900/20 border-blue-700/40 text-blue-400',
    green: 'bg-green-900/20 border-green-700/40 text-green-400',
    amber: 'bg-amber-900/20 border-amber-700/40 text-amber-400',
    red: 'bg-red-900/20 border-red-700/40 text-red-400',
    purple: 'bg-purple-900/20 border-purple-700/40 text-purple-400',
    cyan: 'bg-cyan-900/20 border-cyan-700/40 text-cyan-400',
    orange: 'bg-orange-900/20 border-orange-700/40 text-orange-400',
  }
  return (
    <div className={`card p-5 flex items-center gap-4 border ${colors[color]}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${colors[color]} bg-opacity-30`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-white font-display mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [crimeTypes, setCrimeTypes] = useState([])
  const [perCity, setPerCity] = useState([])
  const [monthly, setMonthly] = useState([])
  const [recent, setRecent] = useState([])
  const [advancedStats, setAdvancedStats] = useState([])

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/dashboard/crime-types').then(r => setCrimeTypes(r.data)).catch(() => {})
    api.get('/dashboard/crimes-per-city').then(r => setPerCity(r.data)).catch(() => {})
    api.get('/dashboard/monthly-trends').then(r => setMonthly(r.data.map(d => ({ ...d, month: d.month?.slice(5) || d.month })))).catch(() => {})
    api.get('/dashboard/recent-incidents').then(r => setRecent(r.data)).catch(() => {})
    api.get('/dashboard/advanced-stats').then(r => setAdvancedStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Crime Management System Overview</p>
        </div>
        <div className="text-xs font-mono text-slate-600 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Crimes" value={stats?.totalCrimes} icon="◈" color="blue" />
        <StatCard label="Open Cases" value={stats?.openCases} icon="◉" color="amber" />
        <StatCard label="Closed Cases" value={stats?.closedCases} icon="◎" color="green" />
        <StatCard label="Officers" value={stats?.officers} icon="◈" color="purple" />
        <StatCard label="Stations" value={stats?.stations} icon="▣" color="cyan" />
        <StatCard label="FIRs Filed" value={stats?.firs} icon="◎" color="orange" />
        <StatCard label="Evidence Items" value={stats?.evidence} icon="◆" color="red" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Crimes by Type</h2>
          {crimeTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={crimeTypes} dataKey="count" nameKey="crime_type" cx="50%" cy="50%"
                  outerRadius={90} innerRadius={50} paddingAngle={3}
                  label={({ crime_type, percent }) => `${crime_type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#334155', strokeWidth: 1 }}
                >
                  {crimeTypes.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-60 flex items-center justify-center text-slate-600">No data</div>}
        </div>

        {/* Bar Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Crimes per City</h2>
          {perCity.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perCity} barSize={28}>
                <XAxis dataKey="city" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14,165,233,0.06)' }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-60 flex items-center justify-center text-slate-600">No data</div>}
        </div>
      </div>

      {/* Novelty: Crime Map & Top Crime Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative z-0">
          <CrimeMap />
        </div>
        <div className="card p-5 overflow-auto max-h-[400px]">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <span className="text-xl">🏆</span> City Hotspots
          </h2>
          <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-widest font-semibold">Processed via SQL Window Functions</p>
          <div className="space-y-3">
            {advancedStats.map((stat, i) => (
              <div key={i} className="bg-navy-900/60 rounded-xl p-3 border border-navy-700/50 flex justify-between items-center transition-all hover:bg-navy-800">
                <div>
                  <p className="text-slate-200 text-sm font-semibold">{stat.city}</p>
                  <p className="text-xs text-slate-400 mt-0.5"><span className="text-slate-500">Peak Crime: </span>{stat.crime_type}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs ring-1 ring-red-500/30">
                  {stat.crime_count}
                </div>
              </div>
            ))}
            {advancedStats.length === 0 && <p className="text-slate-600 text-sm text-center py-5">No advanced stats</p>}
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Monthly Crime Trends</h2>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} fill="url(#areaGrad)" dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-48 flex items-center justify-center text-slate-600">No data</div>}
      </div>

      {/* Recent Incidents */}
      <div className="card">
        <div className="px-5 py-4 border-b border-navy-700">
          <h2 className="section-title">Recent Incidents</h2>
        </div>
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Type</th>
              <th className="table-header">City</th>
              <th className="table-header">Date</th>
              <th className="table-header">Suspects</th>
              <th className="table-header">Victims</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.crime_id} className="table-row">
                <td className="table-cell font-mono text-accent-400">#{r.crime_id}</td>
                <td className="table-cell font-medium">{r.crime_type}</td>
                <td className="table-cell text-slate-400">{r.city}</td>
                <td className="table-cell text-slate-400">{fmtDate(r.date)}</td>
                <td className="table-cell">
                  {r.suspects
                    ? <span className="text-xs text-red-300 bg-red-900/30 px-2 py-0.5 rounded-full">{r.suspects}</span>
                    : <span className="text-slate-600 text-xs">None identified</span>}
                </td>
                <td className="table-cell">
                  {r.victims
                    ? <span className="text-xs text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded-full">{r.victims}</span>
                    : <span className="text-slate-600 text-xs">—</span>}
                </td>
                <td className="table-cell"><span className={statusBadge(r.status)}>{r.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={7} className="table-cell text-center text-slate-600 py-8">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
