import { useEffect, useState, useCallback } from 'react'
import api from '../api'

const opColor = (op) => {
  if (op === 'INSERT') return 'bg-green-900/40 text-green-300 border-green-700/50'
  if (op === 'UPDATE') return 'bg-amber-900/40 text-amber-300 border-amber-700/50'
  if (op === 'DELETE') return 'bg-red-900/40 text-red-300 border-red-700/50'
  return 'bg-slate-800 text-slate-400'
}

const tableColor = (t) => {
  const map = {
    Crime: 'text-blue-400', Case_File: 'text-purple-400',
    FIR: 'text-cyan-400', Evidence: 'text-green-400',
    Police_Officer: 'text-amber-400', Court_Case: 'text-pink-400',
  }
  return map[t] || 'text-slate-400'
}

const opIcon = (op) => {
  if (op === 'INSERT') return '+'
  if (op === 'UPDATE') return '~'
  if (op === 'DELETE') return '−'
  return '?'
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filterTable, setFilterTable] = useState('')
  const [filterOp, setFilterOp] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (filterTable) params.set('table', filterTable)
      if (filterOp) params.set('operation', filterOp)
      const r = await api.get(`/audit-log?${params}`)
      setLogs(r.data.logs)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch { } finally { setLoading(false) }
  }, [page, filterTable, filterOp])

  useEffect(() => { load() }, [load])

  const tables = ['Crime', 'Case_File', 'FIR', 'Evidence', 'Police_Officer', 'Court_Case', 'Crime_Person']
  const ops = ['INSERT', 'UPDATE', 'DELETE']

  const stats = {
    total,
    inserts: logs.filter(l => l.operation === 'INSERT').length,
    updates: logs.filter(l => l.operation === 'UPDATE').length,
    deletes: logs.filter(l => l.operation === 'DELETE').length,
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total activity records</p>
        </div>
        <button onClick={load} className="btn-secondary">↻ Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events', val: total, color: 'text-white' },
          { label: 'Inserts', val: stats.inserts, color: 'text-green-400' },
          { label: 'Updates', val: stats.updates, color: 'text-amber-400' },
          { label: 'Deletes', val: stats.deletes, color: 'text-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold font-display mt-1 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <select className="form-input w-44" value={filterTable} onChange={e => { setFilterTable(e.target.value); setPage(1) }}>
          <option value="">All Tables</option>
          {tables.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-input w-40" value={filterOp} onChange={e => { setFilterOp(e.target.value); setPage(1) }}>
          <option value="">All Operations</option>
          {ops.map(o => <option key={o}>{o}</option>)}
        </select>
        {(filterTable || filterOp) && (
          <button onClick={() => { setFilterTable(''); setFilterOp(''); setPage(1) }}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-navy-700 hover:border-navy-600 transition-colors cursor-pointer">
            Clear filters
          </button>
        )}
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">Log ID</th>
              <th className="table-header">Operation</th>
              <th className="table-header">Table</th>
              <th className="table-header">Record ID</th>
              <th className="table-header">Details</th>
              <th className="table-header">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table-cell text-center text-slate-600 py-10">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-slate-600 py-10">No audit records found</td></tr>
            ) : logs.map(log => (
              <tr key={log.log_id} className="table-row">
                <td className="table-cell font-mono text-accent-400 text-xs">#{log.log_id}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${opColor(log.operation)}`}>
                    <span className="font-bold">{opIcon(log.operation)}</span>
                    {log.operation}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`font-mono text-sm font-medium ${tableColor(log.table_name)}`}>{log.table_name}</span>
                </td>
                <td className="table-cell font-mono text-slate-400">
                  {log.record_id ? `#${log.record_id}` : '—'}
                </td>
                <td className="table-cell text-slate-400 text-xs max-w-xs">
                  <span className="line-clamp-2">{log.details || '—'}</span>
                </td>
                <td className="table-cell text-slate-500 text-xs font-mono whitespace-nowrap">
                  {log.changed_at ? new Date(log.changed_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
