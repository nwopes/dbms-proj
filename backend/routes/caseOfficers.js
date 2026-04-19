const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT co.*, po.name as officer_name, po.designation FROM Case_Officer co JOIN Police_Officer po ON co.officer_id=po.officer_id'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { case_id, officer_id } = req.body;
    await pool.query('INSERT INTO Case_Officer (case_id, officer_id) VALUES (?,?)', [case_id, officer_id]);
    res.json({ message: 'Created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/', async (req, res) => {
  try {
    const { case_id, officer_id } = req.body;
    await pool.query('DELETE FROM Case_Officer WHERE case_id=? AND officer_id=?', [case_id, officer_id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
