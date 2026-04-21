const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const [[crimes]] = await pool.query('SELECT COUNT(*) as total FROM Crime');
    const [[openCases]] = await pool.query("SELECT COUNT(*) as total FROM Case_File WHERE case_status='Open'");
    const [[closedCases]] = await pool.query("SELECT COUNT(*) as total FROM Case_File WHERE case_status='Closed'");
    const [[officers]] = await pool.query('SELECT COUNT(*) as total FROM Police_Officer');
    const [[stations]] = await pool.query('SELECT COUNT(*) as total FROM Police_Station');
    const [[firs]] = await pool.query('SELECT COUNT(*) as total FROM FIR');
    const [[evidence]] = await pool.query('SELECT COUNT(*) as total FROM Evidence');
    res.json({
      totalCrimes: crimes.total,
      openCases: openCases.total,
      closedCases: closedCases.total,
      officers: officers.total,
      stations: stations.total,
      firs: firs.total,
      evidence: evidence.total
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/crime-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT crime_type, COUNT(*) as count FROM Crime GROUP BY crime_type');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/crimes-per-city', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT l.city, COUNT(c.crime_id) as count FROM Crime c JOIN Location l ON c.location_id=l.location_id GROUP BY l.city ORDER BY count DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/monthly-trends', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DATE_FORMAT(date,'%Y-%m') as month, COUNT(*) as count FROM Crime GROUP BY month ORDER BY month"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/recent-incidents', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.crime_id, c.crime_type, c.date, c.status, l.city FROM Crime c JOIN Location l ON c.location_id=l.location_id ORDER BY c.date DESC LIMIT 5'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/advanced-stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      WITH RankedCrimes AS (
        SELECT l.city, c.crime_type, COUNT(*) as crime_count,
               RANK() OVER (PARTITION BY l.city ORDER BY COUNT(*) DESC, c.crime_type ASC) as rnk
        FROM Crime c
        JOIN Location l ON c.location_id = l.location_id
        GROUP BY l.city, c.crime_type
      )
      SELECT city, crime_type, crime_count 
      FROM RankedCrimes 
      WHERE rnk = 1
      ORDER BY crime_count DESC;
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/locations-geospatial', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.city, l.latitude, l.longitude, COUNT(c.crime_id) as crime_count
      FROM Location l
      LEFT JOIN Crime c ON l.location_id = c.location_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
      GROUP BY l.city, l.latitude, l.longitude
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
