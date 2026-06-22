const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

// Note: Table creation and seeding is handled globally at server startup.

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
 * GET /api/stations/davis-live
 * Proxy request to WeatherLink API to bypass CORS.
 */
router.get('/davis-live', authenticate, async (req, res) => {
  const { user: userParam, pass, apiToken } = req.query;

  if (!userParam || !pass || !apiToken) {
    return res.status(400).json({ error: 'user, pass, and apiToken are required query parameters.' });
  }

  try {
    const url = `https://api.weatherlink.com/v1/NoaaExt.json?user=${encodeURIComponent(userParam)}&pass=${encodeURIComponent(pass)}&apiToken=${encodeURIComponent(apiToken)}`;
    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error('WeatherLink Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json({ error: `WeatherLink API error: ${error.response.statusText}`, details: error.response.data });
    } else {
      res.status(500).json({ error: 'Failed to fetch data from WeatherLink API', details: error.message });
    }
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

  const userType = req.user.account_type || req.user.role || '';
  const isLgu = userType === 'LGU Admin' || userType === 'LGU';
  const isProvincial = userType === 'Provincial Admin' || userType === 'Provincial';

  if (isLgu && (province !== req.user.province || lgu !== req.user.city)) {
    return res.status(403).json({ error: `LGU users can only create stations for their assigned LGU: ${req.user.city} in ${req.user.province}.` });
  }

  if (isProvincial && province !== req.user.province) {
    return res.status(403).json({ error: `Provincial users can only create stations for their assigned province: ${req.user.province}.` });
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

    try {
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [req.user.id, 'Station Created', `Created station for LGU ${lgu} (${province})`]
      );
    } catch (logErr) {
      console.error('Failed to write activity log:', logErr);
    }

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

  const userType = req.user.account_type || req.user.role || '';
  const isLgu = userType === 'LGU Admin' || userType === 'LGU';
  const isProvincial = userType === 'Provincial Admin' || userType === 'Provincial';

  if (isLgu) {
    try {
      const stationRes = await pool.query('SELECT province, lgu FROM monitoring_stations WHERE id = $1', [id]);
      if (stationRes.rows.length === 0) {
        return res.status(404).json({ error: 'Station not found' });
      }
      
      const existingProvince = stationRes.rows[0].province;
      const existingLgu = stationRes.rows[0].lgu;
      if (existingProvince !== req.user.province || existingLgu !== req.user.city) {
        return res.status(403).json({ error: `LGU users can only edit stations for their assigned LGU: ${req.user.city} in ${req.user.province}.` });
      }

      if (fields.province && fields.province !== req.user.province) {
        return res.status(403).json({ error: `LGU users cannot change a station's province.` });
      }
      if (fields.lgu && fields.lgu !== req.user.city) {
        return res.status(403).json({ error: `LGU users cannot change a station's LGU.` });
      }
    } catch (dbErr) {
      console.error('Error verifying LGU access for edit:', dbErr);
      return res.status(500).json({ error: 'Database verification failed' });
    }
  }

  if (isProvincial) {
    try {
      const stationRes = await pool.query('SELECT province FROM monitoring_stations WHERE id = $1', [id]);
      if (stationRes.rows.length === 0) {
        return res.status(404).json({ error: 'Station not found' });
      }
      
      const existingProvince = stationRes.rows[0].province;
      if (existingProvince !== req.user.province) {
        return res.status(403).json({ error: `Provincial users can only edit stations for their assigned province: ${req.user.province}.` });
      }

      if (fields.province && fields.province !== req.user.province) {
        return res.status(403).json({ error: `Provincial users cannot change a station's province to a different province.` });
      }
    } catch (dbErr) {
      console.error('Error verifying provincial access for edit:', dbErr);
      return res.status(500).json({ error: 'Database verification failed' });
    }
  }
  
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

    try {
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [req.user.id, 'Station Updated', `Updated station LGU ${result.rows[0].lgu} (${result.rows[0].province})`]
      );
    } catch (logErr) {
      console.error('Failed to write activity log:', logErr);
    }

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

  const userType = req.user.account_type || req.user.role || '';
  const isLgu = userType === 'LGU Admin' || userType === 'LGU';
  const isProvincial = userType === 'Provincial Admin' || userType === 'Provincial';

  if (isLgu) {
    try {
      const stationRes = await pool.query('SELECT province, lgu FROM monitoring_stations WHERE id = $1', [id]);
      const station = stationRes.rows[0];
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
      if (station.province !== req.user.province || station.lgu !== req.user.city) {
        return res.status(403).json({ error: `LGU users can only delete stations for their assigned LGU: ${req.user.city} in ${req.user.province}.` });
      }
    } catch (dbErr) {
      console.error('Error verifying LGU access for delete:', dbErr);
      return res.status(500).json({ error: 'Database verification failed' });
    }
  }

  try {
    const stationRes = await pool.query('SELECT lgu, province FROM monitoring_stations WHERE id = $1', [id]);
    const station = stationRes.rows[0];

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    if (isProvincial && station.province !== req.user.province) {
      return res.status(403).json({ error: `Provincial users can only delete stations for their assigned province: ${req.user.province}.` });
    }

    await pool.query('DELETE FROM monitoring_stations WHERE id = $1', [id]);

    if (station) {
      try {
        await pool.query(
          'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
          [req.user.id, 'Station Deleted', `Deleted station LGU ${station.lgu} (${station.province})`]
        );
      } catch (logErr) {
        console.error('Failed to write activity log:', logErr);
      }
    }

    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

module.exports = router;
