const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, c.crime_type, p.name as filed_by_name
       FROM FIR f LEFT JOIN Crime c ON f.crime_id=c.crime_id LEFT JOIN Person p ON f.filed_by=p.person_id
       ORDER BY f.filing_date DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT f.*, c.crime_type, p.name as filed_by_name FROM FIR f
       LEFT JOIN Crime c ON f.crime_id=c.crime_id LEFT JOIN Person p ON f.filed_by=p.person_id
       WHERE f.fir_id=?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { crime_id, filed_by, filing_date, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO FIR (crime_id, filed_by, filing_date, description) VALUES (?,?,?,?)',
      [crime_id, filed_by, filing_date, description]
    );
    res.json({ fir_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { crime_id, filed_by, filing_date, description } = req.body;
    await pool.query('UPDATE FIR SET crime_id=?, filed_by=?, filing_date=?, description=? WHERE fir_id=?',
      [crime_id, filed_by, filing_date, description, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM FIR WHERE fir_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
