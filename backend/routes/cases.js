const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cf.*, c.crime_type, c.date as crime_date, c.status as crime_status,
       po.name as lead_officer_name, po.designation, l.city, co.officer_id as lead_officer_id
       FROM Case_File cf
       LEFT JOIN Crime c ON cf.crime_id=c.crime_id
       LEFT JOIN Case_Officer co ON cf.case_id=co.case_id AND co.role='Lead'
       LEFT JOIN Police_Officer po ON co.officer_id=po.officer_id
       LEFT JOIN Location l ON c.location_id=l.location_id
       ORDER BY cf.start_date DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT cf.*, c.crime_type, c.date as crime_date, po.name as lead_officer_name, l.city, co.officer_id as lead_officer_id
       FROM Case_File cf
       LEFT JOIN Crime c ON cf.crime_id=c.crime_id
       LEFT JOIN Case_Officer co ON cf.case_id=co.case_id AND co.role='Lead'
       LEFT JOIN Police_Officer po ON co.officer_id=po.officer_id
       LEFT JOIN Location l ON c.location_id=l.location_id
       WHERE cf.case_id=?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    // Include officer_id so the frontend can sync Case_Officer assignments
    const [officers] = await pool.query(
      'SELECT co.officer_id, po.name, po.designation, po.badge_number FROM Case_Officer co JOIN Police_Officer po ON co.officer_id=po.officer_id WHERE co.case_id=?',
      [req.params.id]
    );
    const [evidence] = await pool.query('SELECT * FROM Evidence WHERE case_id=?', [req.params.id]);
    const [court] = await pool.query('SELECT * FROM Court_Case WHERE case_id=?', [req.params.id]);
    res.json({ ...row, officers, evidence, court });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { crime_id, lead_officer_id, case_status, start_date, end_date } = req.body;

    // Issue #3: Warn if a case already exists for this crime
    const [[existing]] = await pool.query('SELECT case_id FROM Case_File WHERE crime_id=? LIMIT 1', [crime_id]);
    if (existing) {
      return res.status(409).json({
        error: `Crime #${crime_id} already has Case File #${existing.case_id}. A crime should only have one case file.`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Case_File (crime_id, case_status, start_date, end_date) VALUES (?,?,?,?)',
      [crime_id, case_status, start_date, end_date]
    );
    const newCaseId = result.insertId;
    if (lead_officer_id) {
       await pool.query('INSERT INTO Case_Officer (case_id, officer_id, role) VALUES (?,?,?)', [newCaseId, lead_officer_id, 'Lead']);
    }
    res.json({ case_id: newCaseId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { crime_id, lead_officer_id, case_status, start_date, end_date } = req.body;

    // Issue #10: Validate end_date >= start_date server-side
    if (end_date && start_date && end_date < start_date) {
      return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    await pool.query(
      'UPDATE Case_File SET crime_id=?, case_status=?, start_date=?, end_date=? WHERE case_id=?',
      [crime_id, case_status, start_date, end_date || null, req.params.id]
    );
    if (lead_officer_id) {
      const [[existingLead]] = await pool.query('SELECT officer_id FROM Case_Officer WHERE case_id=? AND role="Lead"', [req.params.id]);
      if (existingLead) {
        if (existingLead.officer_id != lead_officer_id) {
           await pool.query('UPDATE Case_Officer SET officer_id=? WHERE case_id=? AND role="Lead"', [lead_officer_id, req.params.id]);
        }
      } else {
        await pool.query('INSERT INTO Case_Officer (case_id, officer_id, role) VALUES (?,?,?)', [req.params.id, lead_officer_id, 'Lead']);
      }
    }
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
