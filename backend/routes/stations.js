const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ps.*, l.city, l.address,
       (SELECT COUNT(*) FROM Police_Officer po WHERE po.station_id=ps.station_id) as officer_count
       FROM Police_Station ps LEFT JOIN Location l ON ps.location_id=l.location_id ORDER BY ps.station_name`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT ps.*, l.city, l.address FROM Police_Station ps LEFT JOIN Location l ON ps.location_id=l.location_id WHERE ps.station_id=?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { station_name, location_id, jurisdiction_area } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Police_Station (station_name, location_id, jurisdiction_area) VALUES (?,?,?)',
      [station_name, location_id, jurisdiction_area]
    );
    res.json({ station_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { station_name, location_id, jurisdiction_area } = req.body;
    await pool.query('UPDATE Police_Station SET station_name=?, location_id=?, jurisdiction_area=? WHERE station_id=?',
      [station_name, location_id, jurisdiction_area, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Police_Station WHERE station_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
