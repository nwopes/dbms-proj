import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const empty = { address: '', city: '', state: '', pincode: '' }

// Colour accents cycling per city
const cityColors = [
  'border-blue-500/50', 'border-cyan-500/50', 'border-purple-500/50', 'border-green-500/50',
  'border-amber-500/50', 'border-pink-500/50', 'border-orange-500/50', 'border-teal-500/50',
]

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => {
    api.get('/locations').then(r => setLocations(r.data)).catch(() => toast.error('Failed to load locations'))
  }
  useEffect(() => { load() }, [])

  const filtered = locations.filter(l =>
    !search ||
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.state?.toLowerCase().includes(search.toLowerCase()) ||
    l.address?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (l) => {
    setForm({ address: l.address || '', city: l.city || '', state: l.state || '', pincode: l.pincode || '' })
    setSelected(l); setModal('edit')
  }

  const handleSave = async () => {
    if (!form.city) return toast.error('City is required')
    try {
      if (modal === 'add') { await api.post('/locations', form); toast.success('Location added') }
      else { await api.put(`/locations/${selected.location_id}`, form); toast.success('Location updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/locations/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="text-slate-500 text-sm mt-1">{locations.length} locations in database</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Location</button>
      </div>

      <div className="card p-4">
        <input
          className="form-input max-w-sm"
          placeholder="Search by city, state, or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((l, idx) => (
          <div key={l.location_id} className={`card p-4 border-t-2 ${cityColors[idx % cityColors.length]}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-mono text-accent-400 bg-navy-900 rounded px-2 py-0.5">#{l.location_id}</span>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(l)} className="w-6 h-6 rounded bg-navy-700 hover:bg-navy-600 text-amber-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✎</button>
                <button onClick={() => setDeleteId(l.location_id)} className="w-6 h-6 rounded bg-navy-700 hover:bg-red-900/40 text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✕</button>
              </div>
            </div>

            <p className="text-base font-semibold text-white font-display leading-snug">{l.city || '—'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{l.state || '—'}</p>

            {l.address && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{l.address}</p>
            )}

            {l.pincode && (
              <div className="mt-3 pt-3 border-t border-navy-700">
                <span className="text-xs font-mono text-slate-500">PIN {l.pincode}</span>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-4 text-center text-slate-600 py-16">No locations found</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Location' : 'Edit Location'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Street Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 123 MG Road" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">City *</label>
                <input className="form-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Delhi" />
              </div>
              <div>
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Delhi" />
              </div>
            </div>
            <div>
              <label className="form-label">PIN Code</label>
              <input className="form-input font-mono" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit PIN" maxLength={10} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Add Location' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
