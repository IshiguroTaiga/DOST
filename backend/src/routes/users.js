const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/mailer');

const router = express.Router();

// GET /api/users  – scoped by account_type
router.get('/', authenticate, async (req, res) => {
  const user = req.user;
  try {
    let query = `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.city, u.role, u.status,
      u.created_at, u.account_type, u.province, u.must_change_password, u.theme,
      creator.email AS creator_email
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id`;
    const params = [];
    const conditions = [];

    const isSuperAdmin = user.account_type === 'Super Admin' || user.role === 'Super Admin';
    if (!isSuperAdmin) {
      conditions.push(`u.account_type <> 'Super Admin'`);
      conditions.push(`u.role <> 'Super Admin'`);
    }

    if (user.account_type === 'Provincial Admin') {
      conditions.push(`u.province = $${params.length + 1}`);
      params.push(user.province);
      conditions.push(`u.account_type = ANY($${params.length + 1}::text[])`);
      params.push(['Provincial Admin','Provincial Approver','Provincial','LGU Admin','LGU','LGU Approver']);
    } else if (user.account_type === 'LGU Admin') {
      conditions.push(`u.city = $${params.length + 1}`);
      params.push(user.city);
      conditions.push(`u.account_type = ANY($${params.length + 1}::text[])`);
      params.push(['LGU Admin','LGU']);
    }
    // Regional Admin / Super Admin → all users

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY u.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[Users/GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/pending-count
router.get('/pending-count', authenticate, async (req, res) => {
  const user = req.user;
  try {
    let query = `SELECT COUNT(*) AS count FROM users WHERE status = 'Pending'`;
    const params = [];

    const isSuperAdmin = user.account_type === 'Super Admin' || user.role === 'Super Admin';
    if (!isSuperAdmin) {
      query += ` AND account_type <> 'Super Admin' AND role <> 'Super Admin'`;
    }

    if (user.account_type === 'Provincial Admin') {
      query += ` AND province = $${params.length + 1} AND account_type = ANY($${params.length + 2}::text[])`;
      params.push(user.province, ['Provincial Admin','Provincial Approver','Provincial','LGU Admin','LGU','LGU Approver']);
    } else if (user.account_type === 'LGU Admin') {
      query += ` AND city = $${params.length + 1} AND account_type = ANY($${params.length + 2}::text[])`;
      params.push(user.city, ['LGU Admin','LGU']);
    }

    const { rows } = await pool.query(query, params);
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error('[Users/pending-count]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users  – create user
router.post('/', authenticate, async (req, res) => {
  const { email, first_name, last_name, phone, city, province, account_type, role, password, status } = req.body;
  if (!email || !first_name || !last_name) {
    return res.status(400).json({ error: 'email, first_name, and last_name are required' });
  }

  const requester = req.user;
  const isSuperAdmin = requester.role === 'Super Admin' || requester.account_type === 'Super Admin';
  const isRegionalAdmin = requester.account_type === 'Regional Admin';
  const isProvincialAdmin = requester.account_type === 'Provincial Admin';
  const isLguAdmin = requester.account_type === 'LGU Admin';

  let allowed = false;
  if (isSuperAdmin) {
    allowed = true;
  } else if (isRegionalAdmin) {
    if (account_type !== 'Super Admin' && role !== 'Super Admin') {
      allowed = true;
    }
  } else if (isProvincialAdmin) {
    const allowedTypes = ['Provincial Admin', 'Provincial', 'LGU Admin', 'LGU', 'LGU Approver', 'Provincial Approver'];
    if (allowedTypes.includes(account_type) && province === requester.province) {
      allowed = true;
    }
  } else if (isLguAdmin) {
    const allowedTypes = ['LGU Admin', 'LGU', 'LGU Approver'];
    if (allowedTypes.includes(account_type) && city === requester.city && province === requester.province) {
      allowed = true;
    }
  }

  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to create this type of user' });
  }

  try {
    let tempPassword = password;
    if (!tempPassword) {
      // Generate random 12-char password
      tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    }
    const hash = await bcrypt.hash(tempPassword, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, first_name, last_name, phone, city, province, account_type, role, password_hash, status, must_change_password, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, TRUE, $11) RETURNING id, email, first_name, last_name, phone, city, role, status, created_at, account_type, province, must_change_password, theme, created_by`,
      [email.toLowerCase().trim(), first_name, last_name, phone || '', city || '', province || '', account_type || 'LGU', role || 'Viewer', hash, status || 'Active', req.user.id]
    );

    const user = rows[0];
    
    // Attempt to send email
    const emailResult = await sendWelcomeEmail(user.email, user.first_name, tempPassword);

    // Emit socket event for real-time auto-refresh
    const io = req.app.locals.io;
    if (io) {
      io.emit('users:changed');
    }
    
    res.status(201).json({ 
      ...user, 
      tempPassword, 
      emailSent: emailResult.success,
      emailError: emailResult.error 
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error('[Users/POST]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { 
    email, first_name, last_name, phone, city, province, 
    account_type, role, status, theme, password,
    currentPassword
  } = req.body;

  const requester = req.user;
  const isSuperAdmin = requester.role === 'Super Admin' || requester.account_type === 'Super Admin';
  const isRegionalAdmin = requester.account_type === 'Regional Admin';
  const isProvincialAdmin = requester.account_type === 'Provincial Admin';
  const isLguAdmin = requester.account_type === 'LGU Admin';

  if ((account_type === 'Super Admin' || role === 'Super Admin') && !isSuperAdmin) {
    return res.status(403).json({ error: 'Forbidden: Only Super Admins can assign the Super Admin role' });
  }

  console.log(`[Users/PATCH] Requester ${requester.email} updating user ${id}...`);
  
  try {
    // 1. Fetch target user to check permissions
    const { rows: targetRows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const targetUser = targetRows[0];

    // 2. RBAC: Who can edit whom?
    const isSelf = requester.id === id;
    const targetIsSuperAdmin = targetUser.role === 'Super Admin' || targetUser.account_type === 'Super Admin';
    
    let canEdit = false;
    
    if (targetIsSuperAdmin) {
      // Only Super Admin can edit Super Admin, or the Super Admin can edit themselves
      canEdit = isSuperAdmin || isSelf;
    } else {
      // Regional Admin or Super Admin can edit non-Super Admin
      canEdit = isSuperAdmin || isRegionalAdmin || isSelf;
      
      if (!canEdit) {
        if (isProvincialAdmin) {
          // Provincial Admin can edit users in their province, except Regional/Super Admins
          const restrictedTypes = ['Super Admin', 'Regional Admin', 'Regional'];
          if (targetUser.province === requester.province && !restrictedTypes.includes(targetUser.account_type)) {
            canEdit = true;
          }
        } else if (isLguAdmin) {
          // LGU Admin can edit users in their city
          if (targetUser.city === requester.city && targetUser.account_type === 'LGU') {
            canEdit = true;
          }
        }
      }
    }

    if (!canEdit) {
      console.warn(`[Users/PATCH] Forbidden update attempt by ${requester.email} on ${targetUser.email}`);
      return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this user' });
    }

    // 3. Password logic
    let passwordHash = null;
    if (password && typeof password === 'string' && password.length > 0) {
      console.log(`[Users/PATCH] Password change requested for: ${targetUser.email}`);
      
      if (isSelf) {
        console.log(`[Users/PATCH] currentPassword validation for self-change`);
        if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.length === 0) {
          console.warn(`[Users/PATCH] Password change REJECTED: Missing currentPassword for self-edit of ${targetUser.email}`);
          return res.status(400).json({ error: 'Current password is required to update your own password.' });
        }

        if (!targetUser.password_hash) {
          console.error(`[Users/PATCH] CRITICAL: User ${targetUser.email} has NO password_hash in database!`);
          return res.status(500).json({ error: 'Database integrity error: Target user has no stored password hash.' });
        }

        // Verify the TARGET user's current password
        console.log(`[Users/PATCH] Verifying current password against stored hash...`);
        const isCurrentValid = await bcrypt.compare(currentPassword, targetUser.password_hash);
        
        if (isCurrentValid !== true) {
          console.warn(`[Users/PATCH] Password change REJECTED: Incorrect currentPassword for ${targetUser.email}`);
          return res.status(401).json({ error: 'Incorrect current password. Changes not saved.' });
        }
      } else {
        console.log(`[Users/PATCH] Admin resetting password for ${targetUser.email} (current password bypassed)`);
      }

      console.log(`[Users/PATCH] Hashing new password...`);
      passwordHash = await bcrypt.hash(password, 12);
    }

    // 4. Build update query
    const fields = [];
    const values = [];

    if (email) { fields.push(`email = $${fields.length + 1}`); values.push(email.toLowerCase().trim()); }
    if (first_name) { fields.push(`first_name = $${fields.length + 1}`); values.push(first_name); }
    if (last_name) { fields.push(`last_name = $${fields.length + 1}`); values.push(last_name); }
    if (phone) { fields.push(`phone = $${fields.length + 1}`); values.push(phone); }
    if (city) { fields.push(`city = $${fields.length + 1}`); values.push(city); }
    if (province) { fields.push(`province = $${fields.length + 1}`); values.push(province); }
    
    // Only admins can change account_type/role/status
    if (isSuperAdmin || isRegionalAdmin || isProvincialAdmin || isLguAdmin) {
      if (account_type) { fields.push(`account_type = $${fields.length + 1}`); values.push(account_type); }
      if (role) { fields.push(`role = $${fields.length + 1}`); values.push(role); }
      if (status) { fields.push(`status = $${fields.length + 1}`); values.push(status); }
    }
    
    if (theme) { fields.push(`theme = $${fields.length + 1}`); values.push(theme); }
    if (passwordHash) { fields.push(`password_hash = $${fields.length + 1}`); values.push(passwordHash); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, email, first_name, last_name, phone, city, role, status, created_at, account_type, province, must_change_password, theme`;

    console.log('[Users/PATCH] Executing query...');
    const { rows } = await pool.query(query, values);
    
    console.log(`[Users/PATCH] Successfully updated user ${id}`);

    // Emit socket event for real-time auto-refresh
    const io = req.app.locals.io;
    if (io) {
      io.emit('users:changed');
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[Users/PATCH] ERROR:', err.message);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    // 1. Fetch target user to check permissions
    const { rows: targetRows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    if (targetRows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'User not found' });
    }
    const targetUser = targetRows[0];

    const requester = req.user;
    const isSuperAdmin = requester.role === 'Super Admin' || requester.account_type === 'Super Admin';
    const isRegionalAdmin = requester.account_type === 'Regional Admin';
    const isProvincialAdmin = requester.account_type === 'Provincial Admin';
    const isLguAdmin = requester.account_type === 'LGU Admin';

    const isSelf = requester.id === id;
    if (isSelf) {
      client.release();
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const targetIsSuperAdmin = targetUser.role === 'Super Admin' || targetUser.account_type === 'Super Admin';
    let canDelete = false;

    if (targetIsSuperAdmin) {
      canDelete = isSuperAdmin;
    } else {
      canDelete = isSuperAdmin || isRegionalAdmin;
      if (!canDelete) {
        if (isProvincialAdmin) {
          const restrictedTypes = ['Super Admin', 'Regional Admin', 'Regional'];
          if (targetUser.province === requester.province && !restrictedTypes.includes(targetUser.account_type)) {
            canDelete = true;
          }
        } else if (isLguAdmin) {
          if (targetUser.city === requester.city && targetUser.account_type === 'LGU') {
            canDelete = true;
          }
        }
      }
    }

    if (!canDelete) {
      client.release();
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this user' });
    }

    await client.query('BEGIN');
    
    // 1. Delete referencing activity logs
    await client.query('DELETE FROM public.activity_logs WHERE user_id = $1', [id]);
    
    // 2. Set nullable user foreign key references to NULL to preserve data
    await client.query('UPDATE public.lgu_submissions SET submitted_by = NULL WHERE submitted_by = $1', [id]);
    await client.query('UPDATE public.lgu_submissions SET approved_by = NULL WHERE approved_by = $1', [id]);
    await client.query('UPDATE public.situational_reports SET created_by = NULL WHERE created_by = $1', [id]);
    await client.query('UPDATE public.event_deployments SET deployed_by = NULL WHERE deployed_by = $1', [id]);
    await client.query('UPDATE public.event_signals SET assigned_by = NULL WHERE assigned_by = $1', [id]);
    
    // 3. Delete the user
    await client.query('DELETE FROM public.users WHERE id = $1', [id]);
    
    await client.query('COMMIT');

    // Emit socket event for real-time auto-refresh
    const io = req.app.locals.io;
    if (io) {
      io.emit('users:changed');
    }

    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Users/DELETE]', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
