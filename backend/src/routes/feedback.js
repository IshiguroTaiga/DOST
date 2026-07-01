const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback - Submit new feedback
router.post('/', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  
  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO feedback (user_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, parseInt(rating), comment || '']
    );

    // Emit socket event for real-time refresh if clients are viewing
    const io = req.app.locals.io;
    if (io) {
      io.emit('feedback:changed');
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Feedback/POST]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/feedback - Get feedback stats and list
router.get('/', authenticate, async (req, res) => {
  try {
    // Get all feedbacks with user details
    const { rows: feedbacks } = await pool.query(`
      SELECT f.id, f.rating, f.comment, f.created_at, f.user_id,
             u.first_name, u.last_name, u.email, u.role
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `);

    // Calculate stats
    const total = feedbacks.length;
    let sum = 0;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    feedbacks.forEach(f => {
      sum += f.rating;
      if (breakdown[f.rating] !== undefined) {
        breakdown[f.rating]++;
      }
    });

    const average = total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;

    res.json({
      feedbacks,
      stats: {
        average,
        total,
        breakdown
      }
    });
  } catch (err) {
    console.error('[Feedback/GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
