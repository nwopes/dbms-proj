const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cf.*, c.crime_type, c.date as crime_date, c.status as crime_status,
       po.name as lead_officer_name, po.designation, l.city
       FROM Case_File cf
       LEFT JOIN Crime c ON cf.crime_id=c.crime_id
       LEFT JOIN Police_Officer po ON cf.lead_officer_id=po.officer_id
       LEFT JOIN Location l ON c.location_id=l.location_id
       ORDER BY cf.start_date DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT cf.*, c.crime_type, c.date as crime_date, po.name as lead_officer_name, l.city
       FROM Case_File cf
       LEFT JOIN Crime c ON cf.crime_id=c.crime_id
       LEFT JOIN Police_Officer po ON cf.lead_officer_id=po.officer_id
       LEFT JOIN Location l ON c.location_id=l.location_id
       WHERE cf.case_id=?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    const [officers] = await pool.query('SELECT po.name, po.designation, po.badge_number FROM Case_Officer co JOIN Police_Officer po ON co.officer_id=po.officer_id WHERE co.case_id=?', [req.params.id]);
    const [evidence] = await pool.query('SELECT * FROM Evidence WHERE case_id=?', [req.params.id]);
    const [court] = await pool.query('SELECT * FROM Court_Case WHERE case_id=?', [req.params.id]);
    res.json({ ...row, officers, evidence, court });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { crime_id, lead_officer_id, case_status, start_date, end_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Case_File (crime_id, lead_officer_id, case_status, start_date, end_date) VALUES (?,?,?,?,?)',
      [crime_id, lead_officer_id, case_status, start_date, end_date]
    );
    res.json({ case_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { crime_id, lead_officer_id, case_status, start_date, end_date } = req.body;
    await pool.query(
      'UPDATE Case_File SET crime_id=?, lead_officer_id=?, case_status=?, start_date=?, end_date=? WHERE case_id=?',
      [crime_id, lead_officer_id, case_status, start_date, end_date, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Case_File WHERE case_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
