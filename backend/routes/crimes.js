const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, l.city, l.address, l.state FROM Crime c LEFT JOIN Location l ON c.location_id=l.location_id ORDER BY c.date DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT c.*, l.city, l.address FROM Crime c LEFT JOIN Location l ON c.location_id=l.location_id WHERE c.crime_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    // Include person_id so the frontend can diff and sync Crime_Person links
    const [persons] = await pool.query(
      'SELECT cp.crime_id, cp.person_id, cp.role, p.name, p.age, p.gender FROM Crime_Person cp JOIN Person p ON cp.person_id=p.person_id WHERE cp.crime_id=?',
      [req.params.id]
    );
    const [cases] = await pool.query('SELECT cf.case_id, cf.case_status, po.name as lead_officer FROM Case_File cf LEFT JOIN Police_Officer po ON cf.lead_officer_id=po.officer_id WHERE cf.crime_id=?', [req.params.id]);
    res.json({ ...row, persons, cases });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { crime_type, date, time, location_id, description, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Crime (crime_type, date, time, location_id, description, status) VALUES (?,?,?,?,?,?)',
      [crime_type, date, time, location_id, description, status]
    );
    res.json({ crime_id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { crime_type, date, time, location_id, description, status } = req.body;
    await pool.query(
      'UPDATE Crime SET crime_type=?, date=?, time=?, location_id=?, description=?, status=? WHERE crime_id=?',
      [crime_type, date, time, location_id, description, status, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Crime WHERE crime_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
