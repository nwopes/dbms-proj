import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const empty = { station_name: '', location_id: '', jurisdiction_area: '' }

export default function Stations() {
  const [stations, setStations] = useState([])
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => {
    api.get('/stations').then(r => setStations(r.data)).catch(() => toast.error('Failed to load stations'))
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = stations.filter(s =>
    !search || s.station_name.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (s) => {
    setForm({ station_name: s.station_name, location_id: s.location_id || '', jurisdiction_area: s.jurisdiction_area || '' })
    setSelected(s); setModal('edit')
  }

  const handleSave = async () => {
    if (!form.station_name) return toast.error('Station name is required')
    try {
      if (modal === 'add') { await api.post('/stations', form); toast.success('Station added') }
      else { await api.put(`/stations/${selected.station_id}`, form); toast.success('Station updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/stations/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Police Stations</h1>
          <p className="text-slate-500 text-sm mt-1">{stations.length} stations registered</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Station</button>
      </div>

      <div className="card p-4">
        <input className="form-input max-w-sm" placeholder="Search by name or city..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.station_id} className="card p-5 border-t-2 border-accent-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-navy-700 border border-navy-600 flex items-center justify-center text-xl flex-shrink-0">
                🏢
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg bg-navy-700 hover:bg-navy-600 text-amber-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✎</button>
                <button onClick={() => setDeleteId(s.station_id)} className="w-7 h-7 rounded-lg bg-navy-700 hover:bg-red-900/40 text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✕</button>
              </div>
            </div>

            <h3 className="font-display font-semibold text-white text-base leading-snug">{s.station_name}</h3>

            <div className="mt-3 space-y-1.5">
              {s.city && <p className="text-xs text-slate-500">📍 {s.address ? `${s.address}, ` : ''}{s.city}</p>}
              {s.jurisdiction_area && <p className="text-xs text-slate-500">⬡ Jurisdiction: {s.jurisdiction_area}</p>}
            </div>

            <div className="mt-4 pt-3 border-t border-navy-700 flex items-center justify-between">
              <span className="text-xs text-slate-500">Officers Posted</span>
              <span className="text-sm font-bold text-accent-400 font-display">{s.officer_count ?? 0}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center text-slate-600 py-16">No stations found</div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Police Station' : 'Edit Police Station'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Station Name *</label>
              <input className="form-input" value={form.station_name} onChange={e => setForm(f => ({ ...f, station_name: e.target.value }))} placeholder="e.g. Delhi Central Station" />
            </div>
            <div>
              <label className="form-label">Location</label>
              <select className="form-input" value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                <option value="">— Select Location —</option>
                {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.address}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Jurisdiction Area</label>
              <input className="form-input" value={form.jurisdiction_area} onChange={e => setForm(f => ({ ...f, jurisdiction_area: e.target.value }))} placeholder="e.g. Central Delhi" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Add Station' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
