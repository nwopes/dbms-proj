const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Person ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM Person WHERE person_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const [crimes] = await pool.query('SELECT cp.role, c.crime_type, c.date FROM Crime_Person cp JOIN Crime c ON cp.crime_id=c.crime_id WHERE cp.person_id=?', [req.params.id]);
    res.json({ ...row, crimes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, age, gender, phone_number, address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Person (name, age, gender, phone_number, address) VALUES (?,?,?,?,?)',
      [name, age, gender, phone_number, address]
    );
    res.json({ person_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, age, gender, phone_number, address } = req.body;
    await pool.query('UPDATE Person SET name=?, age=?, gender=?, phone_number=?, address=? WHERE person_id=?',
      [name, age, gender, phone_number, address, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Person WHERE person_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
