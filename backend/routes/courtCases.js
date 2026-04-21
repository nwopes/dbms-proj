const express = require('express');
const router = express.Router();
const pool = require('../db');

const FINAL_VERDICTS = ['Guilty', 'Acquitted', 'Dismissed'];

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cc.*, cf.case_status, c.crime_type FROM Court_Case cc
       LEFT JOIN Case_File cf ON cc.case_id=cf.case_id
       LEFT JOIN Crime c ON cf.crime_id=c.crime_id
       ORDER BY cc.hearing_date DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT cc.*, cf.case_status, c.crime_type FROM Court_Case cc
       LEFT JOIN Case_File cf ON cc.case_id=cf.case_id
       LEFT JOIN Crime c ON cf.crime_id=c.crime_id
       WHERE cc.court_case_id=?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { case_id, court_name, verdict, hearing_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Court_Case (case_id, court_name, verdict, hearing_date) VALUES (?,?,?,?)',
      [case_id, court_name, verdict, hearing_date]
    );

    // Issue #7: Auto-close the linked Case File when verdict is final
    if (FINAL_VERDICTS.includes(verdict)) {
      await pool.query(
        "UPDATE Case_File SET case_status='Closed', end_date=? WHERE case_id=? AND case_status != 'Closed'",
        [hearing_date || new Date().toISOString().split('T')[0], case_id]
      );
    }

    res.json({ court_case_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { case_id, court_name, verdict, hearing_date } = req.body;
    await pool.query('UPDATE Court_Case SET case_id=?, court_name=?, verdict=?, hearing_date=? WHERE court_case_id=?',
      [case_id, court_name, verdict, hearing_date, req.params.id]);

    // Issue #7: Auto-close the linked Case File when verdict becomes final
    if (FINAL_VERDICTS.includes(verdict)) {
      await pool.query(
        "UPDATE Case_File SET case_status='Closed', end_date=? WHERE case_id=? AND case_status != 'Closed'",
        [hearing_date || new Date().toISOString().split('T')[0], case_id]
      );
    }

    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Court_Case WHERE court_case_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
