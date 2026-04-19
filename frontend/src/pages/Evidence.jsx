import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { fmtDate, EVIDENCE_TYPES, evidenceColor, evidenceBadgeColor } from '../utils'

const empty = { case_id: '', evidence_type: 'CCTV Footage', description: '', collected_date: '' }
const typeIcons = { 'CCTV Footage': '📹', 'Weapon': '🔪', 'DNA': '🧬', 'Digital Evidence': '💾', 'Witness Statement': '📋', 'Document': '📄', 'Fingerprint': '👆', 'Other': '◆' }

export default function Evidence() {
  const [evidence, setEvidence] = useState([])
  const [cases, setCases] = useState([])
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [deleteId, setDeleteId] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [uploadingId, setUploadingId] = useState(null)

  const load = () => {
    api.get('/evidence').then(r => setEvidence(r.data)).catch(() => toast.error('Failed to load evidence'))
    api.get('/cases').then(r => setCases(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = filterType ? evidence.filter(e => e.evidence_type === filterType) : evidence

  const openAdd = () => { setForm(empty); setSelected(null); setModal('add') }
  const openEdit = (e) => {
    setForm({ case_id: e.case_id, evidence_type: e.evidence_type, description: e.description || '', collected_date: e.collected_date?.split('T')[0] || '' })
    setSelected(e); setModal('edit')
  }

  const handleSave = async () => {
    if (!form.case_id || !form.evidence_type) return toast.error('Case and type are required')
    try {
      if (modal === 'add') { await api.post('/evidence', form); toast.success('Evidence logged') }
      else { await api.put(`/evidence/${selected.evidence_id}`, form); toast.success('Evidence updated') }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Operation failed') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/evidence/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  const handleFileUpload = async (evidenceId, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploadingId(evidenceId)
    try {
      await api.post(`/uploads/evidence/${evidenceId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('File attached!')
      load()
    } catch (e) { toast.error('Upload failed') }
    finally { setUploadingId(null) }
  }

  const openFile = (e) => {
    if (!e.file_path) return
    window.open(`/api/uploads/file/${e.file_path.split('/').pop()}`, '_blank')
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Evidence Locker</h1><p className="text-slate-500 text-sm mt-1">{evidence.length} items in custody</p></div>
        <button onClick={openAdd} className="btn-primary">+ Log Evidence</button>
      </div>
      <div className="card p-4 flex gap-3 flex-wrap">
        <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors cursor-pointer ${!filterType ? 'bg-accent-500/20 border-accent-500/40 text-accent-400' : 'border-navy-700 text-slate-400 hover:text-slate-200'}`}>All</button>
        {EVIDENCE_TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(t === filterType ? '' : t)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors cursor-pointer ${filterType === t ? 'bg-accent-500/20 border-accent-500/40 text-accent-400' : 'border-navy-700 text-slate-400 hover:text-slate-200'}`}>
            {typeIcons[t]} {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(e => (
          <div key={e.evidence_id} className={`card p-4 ${evidenceColor(e.evidence_type)}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evidenceBadgeColor(e.evidence_type)}`}>{typeIcons[e.evidence_type]} {e.evidence_type}</span>
                <p className="text-xs text-accent-400 font-mono mt-2">#{e.evidence_id} · Case #{e.case_id}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(e)} className="w-7 h-7 rounded-lg bg-navy-700 hover:bg-navy-600 text-amber-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✎</button>
                <button onClick={() => setDeleteId(e.evidence_id)} className="w-7 h-7 rounded-lg bg-navy-700 hover:bg-red-900/40 text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer">✕</button>
              </div>
            </div>
            <p className="text-sm text-slate-200 font-medium mb-1 line-clamp-2">{e.description || 'No description'}</p>
            {/* FILE UPLOAD */}
            <div className="mt-3 pt-3 border-t border-navy-700">
              {e.file_name ? (
                <div className="flex items-center justify-between">
                  <button onClick={() => openFile(e)} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1.5 cursor-pointer">
                    <span>📎</span><span className="truncate max-w-32">{e.file_name}</span>
                  </button>
                  <label className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
                    Replace<input type="file" className="hidden" onChange={ev => handleFileUpload(e.evidence_id, ev.target.files[0])} />
                  </label>
                </div>
              ) : (
                <label className={`flex items-center gap-2 cursor-pointer ${uploadingId === e.evidence_id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-xs text-slate-500 hover:text-accent-400 transition-colors">
                    {uploadingId === e.evidence_id ? '⏳ Uploading...' : '📎 Attach file (PDF / image)'}
                  </span>
                  <input type="file" className="hidden" onChange={ev => handleFileUpload(e.evidence_id, ev.target.files[0])} disabled={uploadingId === e.evidence_id} />
                </label>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">Collected</span>
              <span className="text-xs text-slate-400 font-mono">{fmtDate(e.collected_date)}</span>
            </div>
            {e.crime_type && <p className="text-xs text-slate-500 mt-1">Crime: {e.crime_type}</p>}
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center text-slate-600 py-16">No evidence records found</div>}
      </div>
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Log Evidence' : 'Edit Evidence'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="form-label">Case *</label>
              <select className="form-input" value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                <option value="">— Select Case —</option>
                {cases.map(c => <option key={c.case_id} value={c.case_id}>Case #{c.case_id} · {c.crime_type} · {c.case_status}</option>)}
              </select></div>
            <div><label className="form-label">Evidence Type *</label>
              <select className="form-input" value={form.evidence_type} onChange={e => setForm(f => ({ ...f, evidence_type: e.target.value }))}>
                {EVIDENCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div><label className="form-label">Collection Date</label>
              <input type="date" className="form-input" value={form.collected_date} onChange={e => setForm(f => ({ ...f, collected_date: e.target.value }))} /></div>
            <div><label className="form-label">Description</label>
              <textarea rows={3} className="form-input resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the evidence..." /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 justify-center">{modal === 'add' ? 'Log Evidence' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
      {deleteId && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
