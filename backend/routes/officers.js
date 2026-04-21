const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT po.*, ps.station_name FROM Police_Officer po
       LEFT JOIN Police_Station ps ON po.station_id=ps.station_id
       ORDER BY po.name`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT po.*, ps.station_name FROM Police_Officer po
       LEFT JOIN Police_Station ps ON po.station_id=ps.station_id
       WHERE po.officer_id=?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, designation, badge_number, phone_number, station_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Police_Officer (name, designation, badge_number, phone_number, station_id) VALUES (?,?,?,?,?)',
      [name, designation, badge_number, phone_number, station_id]
    );
    res.json({ officer_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, designation, badge_number, phone_number, station_id } = req.body;
    await pool.query('UPDATE Police_Officer SET name=?, designation=?, badge_number=?, phone_number=?, station_id=? WHERE officer_id=?',
      [name, designation, badge_number, phone_number, station_id, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Issue #13: Pre-check FK references and return a meaningful error message
    const [[{ leadCases }]] = await pool.query(
      "SELECT COUNT(*) as leadCases FROM Case_File WHERE lead_officer_id=? AND case_status != 'Closed'", [id]
    );
    const [[{ assignedCases }]] = await pool.query(
      'SELECT COUNT(*) as assignedCases FROM Case_Officer WHERE officer_id=?', [id]
    );

    if (leadCases > 0 || assignedCases > 0) {
      const parts = [];
      if (leadCases > 0) parts.push(`lead officer on ${leadCases} open case${leadCases > 1 ? 's' : ''}`);
      if (assignedCases > 0) parts.push(`assigned to ${assignedCases} case${assignedCases > 1 ? 's' : ''}`);
      return res.status(409).json({
        error: `Cannot delete: this officer is ${parts.join(' and ')}. Reassign or close those cases first.`
      });
    }

    await pool.query('DELETE FROM Police_Officer WHERE officer_id=?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
