import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { statusBadge, fmtDate, CASE_STATUSES } from '../utils'

const empty = { crime_id: '', lead_officer_id: '', case_status: 'Open', start_date: '', end_date: '' }

export default function Cases() {
  const [cases, setCases] = useState([])
  const [crimes, setCrimes] = useState([])
  const [officers, setOfficers] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    api.get('/cases').then(r => setCases(r.data)).catch(() => toast.error('Failed to load cases'))
    api.get('/crimes').then(r => setCrimes(r.data)).catch(() => {})
    api.get('/officers').then(r => setOfficers(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = filterStatus ? cases.filter(c => c.case_status === filterStatus) : cases

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (c) => {
    setForm({ crime_id: c.crime_id, lead_officer_id: c.lead_officer_id, case_status: c.case_status, start_date: c.start_date?.split('T')[0] || '', end_date: c.end_date?.split('T')[0] || '' })
    setSelected(c); setModal('edit')
  }
  const openView = async (c) => {
    setSelected(c); setModal('view'); setDetail(null)
    try { const r = await api.get(`/cases/${c.case_id}`); setDetail(r.data) } catch { setDetail(c) }
  }

  const handleSave = async () => {
    if (!form.crime_id || !form.lead_officer_id) return toast.error('Crime and lead officer are required')
    try {
      if (modal === 'add') { await api.post('/cases', form); toast.success('Case file created') }
      else { await api.put(`/cases/${selected.case_id}`, form); toast.success('Case updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/cases/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Case Files</h1>
          <p className="text-slate-500 text-sm mt-1">{cases.length} total cases</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ New Case</button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="form-input w-52" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {CASE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="text-sm text-slate-500 self-center ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">Case ID</th>
              <th className="table-header">Crime Type</th>
              <th className="table-header">Lead Officer</th>
              <th className="table-header">Status</th>
              <th className="table-header">Start Date</th>
              <th className="table-header">City</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.case_id} className="table-row">
                <td className="table-cell font-mono text-accent-400">#{c.case_id}</td>
                <td className="table-cell font-medium text-white">{c.crime_type}</td>
                <td className="table-cell text-slate-300">{c.lead_officer_name || '—'}</td>
                <td className="table-cell"><span className={statusBadge(c.case_status)}>{c.case_status}</span></td>
                <td className="table-cell text-slate-400">{fmtDate(c.start_date)}</td>
                <td className="table-cell text-slate-400">{c.city || '—'}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openView(c)} className="text-xs px-2.5 py-1 bg-navy-700 hover:bg-navy-750 text-slate-300 rounded-lg border border-navy-600 transition-colors cursor-pointer">View</button>
                    <button onClick={() => openEdit(c)} className="btn-edit">Edit</button>
                    <button onClick={() => setDeleteId(c.case_id)} className="btn-danger">Delete</button>
                    <a href={`/api/uploads/report/case/${c.case_id}`} download={`Case_Report_${c.case_id}.html`}
                      className="text-xs px-2.5 py-1 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 rounded-lg border border-purple-800/40 transition-colors flex items-center gap-1">
                      📄 Report
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="table-cell text-center text-slate-600 py-10">No cases found</td></tr>}
          </tbody>
        </table>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Create Case File' : 'Edit Case File'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Crime *</label>
              <select className="form-input" value={form.crime_id} onChange={e => setForm(f => ({ ...f, crime_id: e.target.value }))}>
                <option value="">— Select Crime —</option>
                {crimes.map(c => <option key={c.crime_id} value={c.crime_id}>#{c.crime_id} · {c.crime_type} ({fmtDate(c.date)})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Lead Officer *</label>
              <select className="form-input" value={form.lead_officer_id} onChange={e => setForm(f => ({ ...f, lead_officer_id: e.target.value }))}>
                <option value="">— Select Officer —</option>
                {officers.map(o => <option key={o.officer_id} value={o.officer_id}>{o.name} · {o.designation} · {o.station_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.case_status} onChange={e => setForm(f => ({ ...f, case_status: e.target.value }))}>
                {CASE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Create' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title={`Case #${selected.case_id}`} onClose={() => { setModal(null); setDetail(null) }} wide>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[['Crime Type', detail?.crime_type], ['Status', detail?.case_status], ['Lead Officer', detail?.lead_officer_name], ['Designation', detail?.designation], ['Start Date', fmtDate(detail?.start_date)], ['End Date', detail?.end_date ? fmtDate(detail?.end_date) : 'Ongoing']].map(([l, v]) => (
                <div key={l} className="bg-navy-900 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm text-slate-200 font-medium">{l === 'Status' ? <span className={statusBadge(v)}>{v}</span> : v || '—'}</p>
                </div>
              ))}
            </div>
            {detail?.officers?.length > 0 && (
              <div>
                <p className="section-title text-base mb-3">Assigned Officers</p>
                <div className="space-y-2">
                  {detail.officers.map((o, i) => (
                    <div key={i} className="flex items-center justify-between bg-navy-900 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-slate-200">{o.name}</span>
                      <span className="text-xs text-slate-400 bg-navy-800 rounded px-2 py-0.5">{o.designation} · {o.badge_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail?.evidence?.length > 0 && (
              <div>
                <p className="section-title text-base mb-3">Evidence ({detail.evidence.length})</p>
                <div className="space-y-2">
                  {detail.evidence.map((e, i) => (
                    <div key={i} className="bg-navy-900 rounded-lg px-4 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-200">{e.evidence_type}</span>
                        <span className="text-xs text-slate-500">{fmtDate(e.collected_date)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{e.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail?.court?.length > 0 && (
              <div>
                <p className="section-title text-base mb-3">Court Proceedings</p>
                {detail.court.map((cc, i) => (
                  <div key={i} className="bg-navy-900 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-200">{cc.court_name}</span>
                      <span className={statusBadge(cc.verdict)}>{cc.verdict}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Hearing: {fmtDate(cc.hearing_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
