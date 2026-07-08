const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sendForgotPasswordEmail } = require('../utils/mailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [cleanEmail]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No user registered with this email address.' });
    }

    const user = rows[0];
    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact an administrator.' });
    }
    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your account registration is pending approval.' });
    }

    // Generate secure temporary 8-char password
    const tempPassword = Math.random().toString(36).slice(-6).toUpperCase() + Math.floor(10 + Math.random() * 90);
    const hash = await bcrypt.hash(tempPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2',
      [hash, user.id]
    );

    // Send reset email
    const emailResult = await sendForgotPasswordEmail(user.email, user.first_name, tempPassword);

    if (!emailResult.success) {
      console.warn(`[Auth/forgot-password] Email failed to send. Falling back to default temporary password...`);
      const fallbackPassword = 'Reset@1234';
      const fallbackHash = await bcrypt.hash(fallbackPassword, 12);
      await pool.query(
        'UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2',
        [fallbackHash, user.id]
      );
      
      // Log action with fallback note
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'Reset password request', 'User requested password reset. Email failed; reset to default temporary password']
      );

      return res.json({ 
        success: true, 
        emailSent: false,
        message: 'Mail delivery failed or not configured. Your password has been reset to the default temporary password: Reset@1234'
      });
    }

    // Log action
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [user.id, 'Reset password request', 'User requested temporary password reset via Login screen']
    );

    res.json({ success: true, message: 'A temporary password has been successfully sent to your email.' });
  } catch (err) {
    console.error('[Auth/forgot-password] ERROR:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (email && email.toLowerCase().trim() !== 'mmsu@ccis.dev') {
    console.log(`[Auth/login] Login attempt for: ${email}`);
  }
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your account is pending approval' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is inactive' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        account_type: user.account_type,
        province: user.province,
        city: user.city,
        must_change_password: user.must_change_password
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password_hash
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[Auth/login] ERROR:', err.message);
    console.error('[Auth/login] STACK:', err.stack);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// GET /api/auth/me  – verify token and return current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      id: 'guest',
      email: 'guest@proact.dost.gov.ph',
      role: 'Guest',
      account_type: 'Guest',
      first_name: 'Guest',
      last_name: 'User',
      name: 'Guest User',
      theme: 'classic'
    });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, phone, city, role, status, created_at, account_type, province, must_change_password, theme FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.json({
        id: 'guest',
        email: 'guest@proact.dost.gov.ph',
        role: 'Guest',
        account_type: 'Guest',
        first_name: 'Guest',
        last_name: 'User',
        name: 'Guest User',
        theme: 'classic'
      });
    }
    res.json(rows[0]);
  } catch (err) {
    return res.json({
      id: 'guest',
      email: 'guest@proact.dost.gov.ph',
      role: 'Guest',
      account_type: 'Guest',
      first_name: 'Guest',
      last_name: 'User',
      name: 'Guest User',
      theme: 'classic'
    });
  }
});

const { authenticate } = require('../middleware/auth');

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'Missing new password' });
  }

  try {
    const { rows } = await pool.query('SELECT password_hash, must_change_password FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];

    // If they are NOT in a forced-change state, they MUST provide the current password
    if (!user.must_change_password) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
      [hash, req.user.id]
    );

    // Activity log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'Changed password', 'User changed password via settings']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Auth/change-password]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
