import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { DESIGNATIONS } from '../utils'

const empty = { name: '', designation: 'Inspector', badge_number: '', phone_number: '', station_id: '' }

const designationColor = (d) => {
  const map = { 'Inspector': 'bg-blue-900/40 text-blue-300', 'Sub-Inspector': 'bg-cyan-900/40 text-cyan-300', 'ASP': 'bg-purple-900/40 text-purple-300', 'DCP': 'bg-red-900/40 text-red-300', 'SP': 'bg-amber-900/40 text-amber-300', 'DSP': 'bg-orange-900/40 text-orange-300', 'Head Constable': 'bg-green-900/40 text-green-300', 'Constable': 'bg-slate-800 text-slate-400' }
  return map[d] || 'bg-slate-800 text-slate-400'
}

export default function Officers() {
  const [officers, setOfficers] = useState([])
  const [stations, setStations] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => {
    api.get('/officers').then(r => setOfficers(r.data)).catch(() => toast.error('Failed to load officers'))
    api.get('/stations').then(r => setStations(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = officers.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.badge_number?.toLowerCase().includes(search.toLowerCase()) || o.station_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (o) => {
    setForm({ name: o.name, designation: o.designation || 'Inspector', badge_number: o.badge_number, phone_number: o.phone_number || '', station_id: o.station_id || '' })
    setSelected(o); setModal('edit')
  }

  const handleSave = async () => {
    if (!form.name || !form.badge_number) return toast.error('Name and badge number are required')
    try {
      if (modal === 'add') { await api.post('/officers', form); toast.success('Officer added') }
      else { await api.put(`/officers/${selected.officer_id}`, form); toast.success('Officer updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/officers/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Police Officers</h1>
          <p className="text-slate-500 text-sm mt-1">{officers.length} officers on record</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Officer</button>
      </div>

      <div className="card p-4">
        <input className="form-input max-w-sm" placeholder="Search by name, badge, or station..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(o => (
          <div key={o.officer_id} className="card p-5 border-l-4 border-accent-500/40">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-lg font-bold text-accent-400 font-display flex-shrink-0">
                {o.name.charAt(0)}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(o)} className="w-7 h-7 rounded-lg bg-navy-700 hover:bg-navy-600 text-amber-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✎</button>
                <button onClick={() => setDeleteId(o.officer_id)} className="w-7 h-7 rounded-lg bg-navy-700 hover:bg-red-900/40 text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✕</button>
              </div>
            </div>
            <h3 className="font-display font-semibold text-white text-base">{o.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${designationColor(o.designation)}`}>{o.designation}</span>
              <span className="text-xs font-mono text-slate-500">{o.badge_number}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-navy-700 space-y-1.5">
              <p className="text-xs text-slate-500">📍 {o.station_name || 'Unassigned'}</p>
              {o.phone_number && <p className="text-xs text-slate-500">📞 {o.phone_number}</p>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center text-slate-600 py-16">No officers found</div>}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Officer' : 'Edit Officer'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Officer's full name" />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <select className="form-input" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Badge Number *</label>
              <input className="form-input font-mono" value={form.badge_number} onChange={e => setForm(f => ({ ...f, badge_number: e.target.value }))} placeholder="e.g. B1011" />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="10-digit number" />
            </div>
            <div>
              <label className="form-label">Station</label>
              <select className="form-input" value={form.station_id} onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))}>
                <option value="">— Select Station —</option>
                {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Add Officer' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
