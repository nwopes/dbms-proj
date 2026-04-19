import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { fmtDate, statusBadge, VERDICT_OPTIONS } from '../utils'

const empty = { case_id: '', court_name: '', verdict: 'Pending', hearing_date: '' }

export default function CourtCases() {
  const [courtCases, setCourtCases] = useState([])
  const [cases, setCases] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [filterVerdict, setFilterVerdict] = useState('')

  const load = () => {
    api.get('/court-cases').then(r => setCourtCases(r.data)).catch(() => toast.error('Failed to load court cases'))
    api.get('/cases').then(r => setCases(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = filterVerdict ? courtCases.filter(c => c.verdict === filterVerdict) : courtCases

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (c) => {
    setForm({ case_id: c.case_id, court_name: c.court_name || '', verdict: c.verdict || 'Pending', hearing_date: c.hearing_date?.split('T')[0] || '' })
    setSelected(c); setModal('edit')
  }

  const handleSave = async () => {
    if (!form.case_id || !form.court_name) return toast.error('Case and court name are required')
    try {
      if (modal === 'add') { await api.post('/court-cases', form); toast.success('Court case added') }
      else { await api.put(`/court-cases/${selected.court_case_id}`, form); toast.success('Updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/court-cases/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Court Cases</h1>
          <p className="text-slate-500 text-sm mt-1">{courtCases.length} court proceedings</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Proceeding</button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="form-input w-48" value={filterVerdict} onChange={e => setFilterVerdict(e.target.value)}>
          <option value="">All Verdicts</option>
          {VERDICT_OPTIONS.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">Court Case ID</th>
              <th className="table-header">Case #</th>
              <th className="table-header">Crime Type</th>
              <th className="table-header">Court Name</th>
              <th className="table-header">Hearing Date</th>
              <th className="table-header">Verdict</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.court_case_id} className="table-row">
                <td className="table-cell font-mono text-accent-400">#{c.court_case_id}</td>
                <td className="table-cell font-mono text-slate-400">#{c.case_id}</td>
                <td className="table-cell font-medium text-white">{c.crime_type || '—'}</td>
                <td className="table-cell text-slate-300">{c.court_name}</td>
                <td className="table-cell text-slate-400">{fmtDate(c.hearing_date)}</td>
                <td className="table-cell"><span className={statusBadge(c.verdict)}>{c.verdict}</span></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="btn-edit">Edit</button>
                    <button onClick={() => setDeleteId(c.court_case_id)} className="btn-danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="table-cell text-center text-slate-600 py-10">No court cases found</td></tr>}
          </tbody>
        </table>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Court Proceeding' : 'Edit Court Proceeding'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Case File *</label>
              <select className="form-input" value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                <option value="">— Select Case —</option>
                {cases.map(c => <option key={c.case_id} value={c.case_id}>Case #{c.case_id} · {c.crime_type} · {c.case_status}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Court Name *</label>
              <input className="form-input" value={form.court_name} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))} placeholder="e.g. Delhi High Court" />
            </div>
            <div>
              <label className="form-label">Verdict</label>
              <select className="form-input" value={form.verdict} onChange={e => setForm(f => ({ ...f, verdict: e.target.value }))}>
                {VERDICT_OPTIONS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hearing Date</label>
              <input type="date" className="form-input" value={form.hearing_date} onChange={e => setForm(f => ({ ...f, hearing_date: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Add' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
