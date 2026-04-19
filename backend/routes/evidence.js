const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, cf.case_status, c.crime_type FROM Evidence e LEFT JOIN Case_File cf ON e.case_id=cf.case_id LEFT JOIN Crime c ON cf.crime_id=c.crime_id ORDER BY e.collected_date DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM Evidence WHERE evidence_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { case_id, evidence_type, description, collected_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Evidence (case_id, evidence_type, description, collected_date) VALUES (?,?,?,?)',
      [case_id, evidence_type, description, collected_date]
    );
    res.json({ evidence_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { case_id, evidence_type, description, collected_date } = req.body;
    await pool.query('UPDATE Evidence SET case_id=?, evidence_type=?, description=?, collected_date=? WHERE evidence_id=?',
      [case_id, evidence_type, description, collected_date, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Evidence WHERE evidence_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
