import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { fmtDate, GENDERS } from '../utils'

const empty = { name: '', age: '', gender: 'Male', phone_number: '', location_id: '' }

const roleColor = (role) => {
  if (role === 'Victim') return 'bg-blue-900/40 text-blue-300'
  if (role === 'Suspect') return 'bg-red-900/40 text-red-300'
  if (role === 'Witness') return 'bg-green-900/40 text-green-300'
  return 'bg-slate-800 text-slate-400'
}

export default function Persons() {
  const [persons, setPersons] = useState([])
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => {
    api.get('/persons').then(r => setPersons(r.data)).catch(() => toast.error('Failed to load persons'))
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = persons.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone_number?.includes(search)
  )

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (p) => {
    setForm({ name: p.name, age: p.age || '', gender: p.gender || 'Male', phone_number: p.phone_number || '', location_id: p.location_id || '' })
    setSelected(p); setModal('edit')
  }
  const openView = async (p) => {
    setSelected(p); setModal('view'); setDetail(null)
    try { const r = await api.get(`/persons/${p.person_id}`); setDetail(r.data) } catch { setDetail(p) }
  }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required')
    try {
      if (modal === 'add') { await api.post('/persons', form); toast.success('Person added') }
      else { await api.put(`/persons/${selected.person_id}`, form); toast.success('Person updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/persons/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Persons</h1>
          <p className="text-slate-500 text-sm mt-1">{persons.length} persons in system</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Person</button>
      </div>

      <div className="card p-4">
        <input className="form-input max-w-sm" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Name</th>
              <th className="table-header">Age</th>
              <th className="table-header">Gender</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Location</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.person_id} className="table-row">
                <td className="table-cell font-mono text-accent-400">#{p.person_id}</td>
                <td className="table-cell font-medium text-white">{p.name}</td>
                <td className="table-cell text-slate-400">{p.age ?? '—'}</td>
                <td className="table-cell text-slate-400">{p.gender || '—'}</td>
                <td className="table-cell font-mono text-sm text-slate-400">{p.phone_number || '—'}</td>
                <td className="table-cell text-slate-400 max-w-xs truncate">{p.city ? `${p.city} (${p.location_address})` : '—'}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openView(p)} className="text-xs px-2.5 py-1 bg-navy-700 hover:bg-navy-750 text-slate-300 rounded-lg border border-navy-600 transition-colors cursor-pointer">View</button>
                    <button onClick={() => openEdit(p)} className="btn-edit">Edit</button>
                    <button onClick={() => setDeleteId(p.person_id)} className="btn-danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="table-cell text-center text-slate-600 py-10">No persons found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Person' : 'Edit Person'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Age</label>
                <input type="number" className="form-input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Age in years" min="0" max="120" />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="form-input font-mono" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="10-digit number" />
            </div>
            <div>
              <label className="form-label">Location</label>
              <select className="form-input" value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                <option value="">— Select Location —</option>
                {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.city} - {l.address}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Add Person' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <Modal title={`${selected.name}`} onClose={() => { setModal(null); setDetail(null) }} wide>
          <div className="space-y-5">
            {/* Avatar + basic info */}
            <div className="flex items-center gap-4 bg-navy-900 rounded-xl p-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-2xl font-bold text-accent-400 font-display flex-shrink-0">
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-white font-display">{selected.name}</p>
                <p className="text-sm text-slate-400">{selected.gender} · {selected.age ? `${selected.age} years` : 'Age unknown'}</p>
                {selected.phone_number && <p className="text-sm text-slate-500 font-mono">{selected.phone_number}</p>}
              </div>
            </div>
            {selected.city && (
              <div className="bg-navy-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-sm text-slate-300">{selected.city} - {selected.location_address}</p>
              </div>
            )}
            {/* Crime involvement */}
            {detail?.crimes?.length > 0 && (
              <div>
                <p className="section-title text-base mb-3">Crime Involvement ({detail.crimes.length})</p>
                <div className="space-y-2">
                  {detail.crimes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-navy-900 rounded-lg px-4 py-2.5">
                      <div>
                        <span className="text-sm text-slate-200 font-medium">{c.crime_type}</span>
                        <span className="text-xs text-slate-500 ml-2">{fmtDate(c.date)}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(c.role)}`}>{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail?.crimes?.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No crime involvement recorded</p>
            )}
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
