const express = require('express')
const router = express.Router()
const pool = require('../db')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|mp4|doc|docx/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype)
    if (ext || mime) cb(null, true)
    else cb(new Error('File type not allowed'))
  }
})

// Upload file for evidence
router.post('/evidence/:id', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const { id } = req.params
    const filePath = `/uploads/${req.file.filename}`
    await pool.query(
      'UPDATE Evidence SET file_path=?, file_name=?, file_type=? WHERE evidence_id=?',
      [filePath, req.file.originalname, req.file.mimetype, id]
    )
    res.json({ file_path: filePath, file_name: req.file.originalname, file_type: req.file.mimetype })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Serve uploaded files
router.get('/file/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.sendFile(filePath)
})

// Generate PDF report for a case
router.get('/report/case/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Fetch all case data
    const [[caseData]] = await pool.query(`
      SELECT cf.*, c.crime_type, c.date as crime_date, c.time as crime_time,
             c.description as crime_description, c.status as crime_status,
             po.name as lead_officer, po.designation, po.badge_number,
             l.address, l.city, l.state
      FROM Case_File cf
      JOIN Crime c ON cf.crime_id = c.crime_id
      JOIN Police_Officer po ON cf.lead_officer_id = po.officer_id
      JOIN Location l ON c.location_id = l.location_id
      WHERE cf.case_id = ?`, [id])

    if (!caseData) return res.status(404).json({ error: 'Case not found' })

    const [officers] = await pool.query(
      'SELECT po.name, po.designation, po.badge_number FROM Case_Officer co JOIN Police_Officer po ON co.officer_id=po.officer_id WHERE co.case_id=?', [id])
    const [evidence] = await pool.query('SELECT * FROM Evidence WHERE case_id=?', [id])
    const [court] = await pool.query('SELECT * FROM Court_Case WHERE case_id=?', [id])
    const [persons] = await pool.query(
      'SELECT p.name, p.age, p.gender, cp.role FROM Crime_Person cp JOIN Person p ON cp.person_id=p.person_id WHERE cp.crime_id=?',
      [caseData.crime_id])

    // Build HTML for PDF
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: white; }
  .header { background: linear-gradient(135deg, #0a1628 0%, #1a3460 100%); color: white; padding: 32px 40px; }
  .header h1 { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
  .header p { font-size: 13px; opacity: 0.7; margin-top: 4px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 8px; }
  .badge-open { background: rgba(59,130,246,0.3); color: #93c5fd; }
  .badge-closed { background: rgba(34,197,94,0.3); color: #86efac; }
  .badge-investigation { background: rgba(245,158,11,0.3); color: #fcd34d; }
  .content { padding: 32px 40px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0ea5e9; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .field-label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .field-value { font-size: 13px; color: #1e293b; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
  tr:last-child td { border-bottom: none; }
  .empty { color: #94a3b8; font-style: italic; font-size: 13px; padding: 12px 0; }
  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 40px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  .meta { background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
</style>
</head>
<body>
<div class="header">
  <p>CRIME MANAGEMENT SYSTEM — CSD317</p>
  <h1>CASE FILE REPORT #${caseData.case_id}</h1>
  <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
  <span class="badge badge-${caseData.case_status === 'Open' ? 'open' : caseData.case_status === 'Closed' ? 'closed' : 'investigation'}">${caseData.case_status}</span>
</div>

<div class="content">
  <div class="section">
    <div class="section-title">Case Overview</div>
    <div class="grid2">
      <div class="field"><div class="field-label">Case ID</div><div class="field-value">#${caseData.case_id}</div></div>
      <div class="field"><div class="field-label">Crime Type</div><div class="field-value">${caseData.crime_type}</div></div>
      <div class="field"><div class="field-label">Crime Date</div><div class="field-value">${fmt(caseData.crime_date)}</div></div>
      <div class="field"><div class="field-label">Crime Time</div><div class="field-value">${caseData.crime_time || '—'}</div></div>
      <div class="field"><div class="field-label">Location</div><div class="field-value">${caseData.address || '—'}, ${caseData.city}</div></div>
      <div class="field"><div class="field-label">Case Status</div><div class="field-value">${caseData.case_status}</div></div>
      <div class="field"><div class="field-label">Start Date</div><div class="field-value">${fmt(caseData.start_date)}</div></div>
      <div class="field"><div class="field-label">End Date</div><div class="field-value">${caseData.end_date ? fmt(caseData.end_date) : 'Ongoing'}</div></div>
    </div>
    ${caseData.crime_description ? `<div class="field" style="margin-top:12px"><div class="field-label">Description</div><div class="field-value">${caseData.crime_description}</div></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Lead Officer</div>
    <div class="grid2">
      <div class="field"><div class="field-label">Name</div><div class="field-value">${caseData.lead_officer}</div></div>
      <div class="field"><div class="field-label">Designation</div><div class="field-value">${caseData.designation}</div></div>
      <div class="field"><div class="field-label">Badge Number</div><div class="field-value">${caseData.badge_number}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Assigned Officers (${officers.length})</div>
    ${officers.length ? `<table><thead><tr><th>Name</th><th>Designation</th><th>Badge</th></tr></thead><tbody>
    ${officers.map(o => `<tr><td>${o.name}</td><td>${o.designation}</td><td>${o.badge_number}</td></tr>`).join('')}
    </tbody></table>` : '<p class="empty">No additional officers assigned</p>'}
  </div>

  <div class="section">
    <div class="section-title">Persons Involved (${persons.length})</div>
    ${persons.length ? `<table><thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Role</th></tr></thead><tbody>
    ${persons.map(p => `<tr><td>${p.name}</td><td>${p.age || '—'}</td><td>${p.gender || '—'}</td><td>${p.role}</td></tr>`).join('')}
    </tbody></table>` : '<p class="empty">No persons linked to this crime</p>'}
  </div>

  <div class="section">
    <div class="section-title">Evidence (${evidence.length})</div>
    ${evidence.length ? `<table><thead><tr><th>Type</th><th>Description</th><th>Collected</th><th>File</th></tr></thead><tbody>
    ${evidence.map(e => `<tr><td>${e.evidence_type}</td><td>${e.description || '—'}</td><td>${fmt(e.collected_date)}</td><td>${e.file_name || '—'}</td></tr>`).join('')}
    </tbody></table>` : '<p class="empty">No evidence logged for this case</p>'}
  </div>

  <div class="section">
    <div class="section-title">Court Proceedings (${court.length})</div>
    ${court.length ? `<table><thead><tr><th>Court</th><th>Verdict</th><th>Hearing Date</th></tr></thead><tbody>
    ${court.map(c => `<tr><td>${c.court_name}</td><td>${c.verdict}</td><td>${fmt(c.hearing_date)}</td></tr>`).join('')}
    </tbody></table>` : '<p class="empty">No court proceedings recorded</p>'}
  </div>
</div>

<div class="footer">
  <span>CSD317 — Introduction to Database Systems · Shiv Nadar IoE</span>
  <span>Case #${caseData.case_id} · Confidential</span>
</div>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `attachment; filename="Case_Report_${id}.html"`)
    res.send(html)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
