import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { statusBadge, fmtDate, CRIME_TYPES, CRIME_STATUSES, ROLES } from '../utils'

const empty = { crime_type: 'Theft', date: '', time: '', location_id: '', description: '', status: 'Open' }

export default function Crimes() {
  const [crimes, setCrimes] = useState([])
  const [locations, setLocations] = useState([])
  const [persons, setPersons] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [detail, setDetail] = useState(null)

  // Issues #1 & #4: Track persons linked to the crime being added/edited
  const [formPersons, setFormPersons] = useState([])    // [{person_id, name, role}] — working copy
  const [origPersons, setOrigPersons] = useState([])    // snapshot at edit-open time for diffing

  const load = () => {
    api.get('/crimes').then(r => setCrimes(r.data)).catch(() => toast.error('Failed to load crimes'))
    api.get('/locations').then(r => setLocations(r.data)).catch(() => {})
    api.get('/persons').then(r => setPersons(r.data)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const filtered = crimes.filter(c => {
    const matchSearch = !search || c.crime_type.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || c.status === filterStatus
    const matchType = !filterType || c.crime_type === filterType
    return matchSearch && matchStatus && matchType
  })

  const openAdd = () => {
    setForm(empty)
    setSelected(null)
    setFormPersons([])
    setOrigPersons([])
    setModal('add')
  }

  // Issue #4: Load existing Crime_Person links when editing
  const openEdit = async (c) => {
    setForm({ crime_type: c.crime_type, date: c.date?.split('T')[0] || '', time: c.time || '', location_id: c.location_id || '', description: c.description || '', status: c.status || 'Open' })
    setSelected(c)
    setFormPersons([])
    setOrigPersons([])
    setModal('edit')
    try {
      const r = await api.get(`/crimes/${c.crime_id}`)
      const linked = (r.data.persons || []).map(p => ({ person_id: String(p.person_id), name: p.name, role: p.role }))
      setFormPersons(linked)
      setOrigPersons(linked)
    } catch { /* keep empty */ }
  }

  const openView = async (c) => {
    setSelected(c)
    setModal('view')
    try {
      const r = await api.get(`/crimes/${c.crime_id}`)
      setDetail(r.data)
    } catch { setDetail(c) }
  }

  // Add a blank person row to the form
  const addPersonRow = () => {
    setFormPersons(fp => [...fp, { person_id: '', name: '', role: 'Suspect' }])
  }

  const removePersonRow = (idx) => {
    setFormPersons(fp => fp.filter((_, i) => i !== idx))
  }

  const updatePersonRow = (idx, field, value) => {
    setFormPersons(fp => fp.map((p, i) => {
      if (i !== idx) return p
      if (field === 'person_id') {
        const found = persons.find(px => String(px.person_id) === value)
        return { ...p, person_id: value, name: found?.name || '' }
      }
      return { ...p, [field]: value }
    }))
  }

  // Sync Crime_Person records after saving the crime
  const syncPersons = async (crimeId) => {
    const validNew = formPersons.filter(p => p.person_id)

    if (modal === 'add') {
      for (const p of validNew) {
        try { await api.post('/crime-persons', { crime_id: crimeId, person_id: p.person_id, role: p.role }) } catch { /* ignore dup */ }
      }
    } else {
      const origIds = origPersons.map(p => p.person_id)
      const newIds = validNew.map(p => p.person_id)

      // Remove persons no longer in the list
      for (const orig of origPersons) {
        if (!newIds.includes(orig.person_id)) {
          try { await api.delete('/crime-persons', { data: { crime_id: crimeId, person_id: orig.person_id } }) } catch { /* ignore */ }
        }
      }
      // Add newly linked persons
      for (const np of validNew) {
        if (!origIds.includes(np.person_id)) {
          try { await api.post('/crime-persons', { crime_id: crimeId, person_id: np.person_id, role: np.role }) } catch { /* ignore */ }
        }
      }
      // Update roles that changed
      for (const np of validNew) {
        const orig = origPersons.find(p => p.person_id === np.person_id)
        if (orig && orig.role !== np.role) {
          try { await api.put('/crime-persons', { crime_id: crimeId, person_id: np.person_id, role: np.role }) } catch { /* ignore */ }
        }
      }
    }
  }

  const handleSave = async () => {
    if (!form.crime_type || !form.date) return toast.error('Crime type and date are required')

    // Validate no duplicate persons
    const validPersons = formPersons.filter(p => p.person_id)
    const uniqueIds = new Set(validPersons.map(p => p.person_id))
    if (uniqueIds.size !== validPersons.length) return toast.error('A person cannot be added twice to the same crime')

    try {
      let crimeId
      if (modal === 'add') {
        const r = await api.post('/crimes', form)
        crimeId = r.data.crime_id
        toast.success('Crime record added')
      } else {
        await api.put(`/crimes/${selected.crime_id}`, form)
        crimeId = selected.crime_id
        toast.success('Crime record updated')
      }
      await syncPersons(crimeId)
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/crimes/${deleteId}`)
      toast.success('Deleted')
      setDeleteId(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  const roleColor = (role) => {
    if (role === 'Suspect') return 'bg-red-900/40 text-red-300'
    if (role === 'Victim') return 'bg-blue-900/40 text-blue-300'
    return 'bg-green-900/40 text-green-300'
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Crime Records</h1>
          <p className="text-slate-500 text-sm mt-1">{crimes.length} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Crime</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input className="form-input flex-1 min-w-48" placeholder="Search by type or city..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {CRIME_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-input w-44" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {CRIME_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Type</th>
              <th className="table-header">Date</th>
              <th className="table-header">Location</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.crime_id} className="table-row">
                <td className="table-cell font-mono text-accent-400">#{c.crime_id}</td>
                <td className="table-cell font-medium text-white">{c.crime_type}</td>
                <td className="table-cell text-slate-400">{fmtDate(c.date)}</td>
                <td className="table-cell text-slate-400">{c.city || '—'}</td>
                <td className="table-cell"><span className={statusBadge(c.status)}>{c.status}</span></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openView(c)} className="text-xs px-2.5 py-1 bg-navy-700 hover:bg-navy-750 text-slate-300 rounded-lg border border-navy-600 transition-colors cursor-pointer">View</button>
                    <button onClick={() => openEdit(c)} className="btn-edit">Edit</button>
                    <button onClick={() => setDeleteId(c.crime_id)} className="btn-danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="table-cell text-center text-slate-600 py-10">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Crime Record' : 'Edit Crime Record'} onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            <div>
              <label className="form-label">Crime Type *</label>
              <select className="form-input" value={form.crime_type} onChange={e => setForm(f => ({ ...f, crime_type: e.target.value }))}>
                {CRIME_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Time</label>
                <input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Location</label>
              <select className="form-input" value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                <option value="">— Select Location —</option>
                {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.address}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {CRIME_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea rows={3} className="form-input resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the incident..." />
            </div>

            {/* Issues #1 & #4: Persons Involved */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Persons Involved</label>
                <button onClick={addPersonRow} className="text-xs px-2.5 py-1 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 rounded-lg border border-accent-500/30 transition-colors cursor-pointer">
                  + Add Person
                </button>
              </div>
              {formPersons.length === 0 && (
                <p className="text-xs text-slate-600 italic py-2">No persons linked yet. Click "+ Add Person" to attach suspects, victims, or witnesses.</p>
              )}
              <div className="space-y-2">
                {formPersons.map((fp, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className="form-input flex-1"
                      value={fp.person_id}
                      onChange={e => updatePersonRow(idx, 'person_id', e.target.value)}
                    >
                      <option value="">— Select Person —</option>
                      {persons.map(p => (
                        <option key={p.person_id} value={String(p.person_id)}>
                          {p.name} {p.age ? `(${p.age}y)` : ''} · {p.gender || ''}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-input w-32"
                      value={fp.role}
                      onChange={e => updatePersonRow(idx, 'role', e.target.value)}
                    >
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <button
                      onClick={() => removePersonRow(idx)}
                      className="w-8 h-9 flex-shrink-0 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 flex items-center justify-center text-sm transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">
                {modal === 'add' ? 'Add Record' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <Modal title={`Crime #${selected.crime_id} — ${selected.crime_type}`} onClose={() => { setModal(null); setDetail(null) }} wide>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Crime Type', detail?.crime_type],
                ['Status', detail?.status],
                ['Date', fmtDate(detail?.date)],
                ['Time', detail?.time || '—'],
                ['Location', detail?.address ? `${detail.address}, ${detail.city}` : '—'],
                ['City', detail?.city || '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-navy-900 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-slate-200 font-medium">{label === 'Status' ? <span className={statusBadge(val)}>{val}</span> : val || '—'}</p>
                </div>
              ))}
            </div>
            {detail?.description && (
              <div className="bg-navy-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-300">{detail.description}</p>
              </div>
            )}
            {detail?.persons?.length > 0 && (
              <div>
                <p className="section-title text-base mb-3">Persons Involved ({detail.persons.length})</p>
                <div className="space-y-2">
                  {detail.persons.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-navy-900 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-slate-200">{p.name} <span className="text-slate-500 text-xs">· {p.gender}, {p.age}y</span></span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(p.role)}`}>{p.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!detail?.persons || detail.persons.length === 0) && (
              <p className="text-sm text-slate-600 text-center py-2">No persons linked to this crime.</p>
            )}
            {detail?.cases?.length > 0 && (
              <div>
                <p className="section-title text-base mb-3">Linked Case Files</p>
                <div className="space-y-2">
                  {detail.cases.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-navy-900 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-slate-200 font-mono">Case #{c.case_id}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{c.lead_officer}</span>
                        <span className={statusBadge(c.case_status)}>{c.case_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
