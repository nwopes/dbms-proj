const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET all audit logs with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const offset = (page - 1) * limit
    const table = req.query.table || ''
    const op = req.query.operation || ''

    let where = []
    let params = []
    if (table) { where.push('table_name = ?'); params.push(table) }
    if (op) { where.push('operation = ?'); params.push(op) }
    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM Audit_Log ${whereSQL}`, params)
    const [rows] = await pool.query(
      `SELECT * FROM Audit_Log ${whereSQL} ORDER BY changed_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    res.json({ logs: rows, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
