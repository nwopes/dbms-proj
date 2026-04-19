import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { fmtDate } from '../utils'

const empty = { crime_id: '', filed_by: '', filing_date: '', description: '' }

export default function FIRs() {
  const [firs, setFirs] = useState([])
  const [crimes, setCrimes] = useState([])
  const [persons, setPersons] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)

  const load = () => {
    api.get('/firs').then(r => setFirs(r.data)).catch(() => toast.error('Failed to load FIRs'))
    api.get('/crimes').then(r => setCrimes(r.data)).catch(() => {})
    api.get('/persons').then(r => setPersons(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (f) => {
    setForm({ crime_id: f.crime_id, filed_by: f.filed_by, filing_date: f.filing_date?.split('T')[0] || '', description: f.description || '' })
    setSelected(f); setModal('edit')
  }
  const openView = (f) => { setSelected(f); setModal('view') }

  const handleSave = async () => {
    if (!form.crime_id || !form.filed_by || !form.filing_date) return toast.error('Crime, person, and date are required')
    try {
      if (modal === 'add') { await api.post('/firs', form); toast.success('FIR filed') }
      else { await api.put(`/firs/${selected.fir_id}`, form); toast.success('FIR updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/firs/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">FIR Records</h1>
          <p className="text-slate-500 text-sm mt-1">{firs.length} FIRs on record</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ File FIR</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">FIR ID</th>
              <th className="table-header">Crime Type</th>
              <th className="table-header">Filed By</th>
              <th className="table-header">Filing Date</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {firs.map(f => (
              <tr key={f.fir_id} className="table-row">
                <td className="table-cell font-mono text-accent-400">#{f.fir_id}</td>
                <td className="table-cell font-medium text-white">{f.crime_type}</td>
                <td className="table-cell text-slate-300">{f.filed_by_name}</td>
                <td className="table-cell text-slate-400">{fmtDate(f.filing_date)}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openView(f)} className="text-xs px-2.5 py-1 bg-navy-700 hover:bg-navy-750 text-slate-300 rounded-lg border border-navy-600 transition-colors cursor-pointer">View</button>
                    <button onClick={() => openEdit(f)} className="btn-edit">Edit</button>
                    <button onClick={() => setDeleteId(f.fir_id)} className="btn-danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {firs.length === 0 && <tr><td colSpan={5} className="table-cell text-center text-slate-600 py-10">No FIRs found</td></tr>}
          </tbody>
        </table>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'File New FIR' : 'Edit FIR'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Related Crime *</label>
              <select className="form-input" value={form.crime_id} onChange={e => setForm(f => ({ ...f, crime_id: e.target.value }))}>
                <option value="">— Select Crime —</option>
                {crimes.map(c => <option key={c.crime_id} value={c.crime_id}>#{c.crime_id} · {c.crime_type} ({fmtDate(c.date)})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Filed By *</label>
              <select className="form-input" value={form.filed_by} onChange={e => setForm(f => ({ ...f, filed_by: e.target.value }))}>
                <option value="">— Select Person —</option>
                {persons.map(p => <option key={p.person_id} value={p.person_id}>{p.name} (ID: {p.person_id})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Filing Date *</label>
              <input type="date" className="form-input" value={form.filing_date} onChange={e => setForm(f => ({ ...f, filing_date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea rows={4} className="form-input resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details of the FIR..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'File FIR' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title={`FIR #${selected.fir_id}`} onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['FIR ID', `#${selected.fir_id}`], ['Crime Type', selected.crime_type], ['Filed By', selected.filed_by_name], ['Filing Date', fmtDate(selected.filing_date)]].map(([l, v]) => (
                <div key={l} className="bg-navy-900 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm text-slate-200 font-medium">{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-navy-900 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{selected.description || 'No description provided.'}</p>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
