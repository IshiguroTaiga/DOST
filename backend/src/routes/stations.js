const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

/**
 * Helper to ensure table exists with all necessary columns.
 */
async function ensureTable() {
  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.monitoring_stations (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        province TEXT NOT NULL,
        lgu TEXT NOT NULL,
        address TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        equipment_details JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT monitoring_stations_pkey PRIMARY KEY (id)
      )
    `);

    // Ensure photo_url column exists (added in later update)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monitoring_stations' AND column_name='photo_url') THEN
          ALTER TABLE monitoring_stations ADD COLUMN photo_url TEXT;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.error('[Stations Init] Error ensuring table exists:', err);
  }
}

// Run init
ensureTable();

/**
 * GET /api/stations
 * Returns all monitoring and warning stations.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT * FROM monitoring_stations 
      ORDER BY province ASC, lgu ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

/**
 * POST /api/stations
 * Manually create a new monitoring station.
 * Open to all authenticated users.
 */
router.post('/', authenticate, async (req, res) => {
  const { province, lgu, address, latitude, longitude, equipment_details, photo_url } = req.body;
  
  if (!province || !lgu || !latitude || !longitude) {
    return res.status(400).json({ error: 'Province, LGU, and precise coordinates are required.' });
  }

  try {
    const query = `
      INSERT INTO monitoring_stations (province, lgu, address, latitude, longitude, equipment_details, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      province,
      lgu,
      address || '',
      latitude,
      longitude,
      JSON.stringify(equipment_details || {}),
      photo_url || null
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ error: 'Failed to create station' });
  }
});

/**
 * PATCH /api/stations/:id
 * Update an existing station.
 * Open to all authenticated users.
 */
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  
  // Dynamic query builder
  const setClauses = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (['province', 'lgu', 'address', 'latitude', 'longitude', 'equipment_details', 'photo_url'].includes(key)) {
      setClauses.push(`${key} = $${i}`);
      values.push(key === 'equipment_details' ? JSON.stringify(value) : value);
      i++;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update.' });
  }

  values.push(id);
  const query = `
    UPDATE monitoring_stations 
    SET ${setClauses.join(', ')} 
    WHERE id = $${i} 
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Station not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ error: 'Failed to update station' });
  }
});

/**
 * DELETE /api/stations/:id
 * Delete a station.
 * Open to all authenticated users.
 */
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM monitoring_stations WHERE id = $1', [id]);
    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

module.exports = router;
