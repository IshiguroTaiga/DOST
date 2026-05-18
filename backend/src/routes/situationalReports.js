const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/situational-reports
router.get('/', authenticate, async (req, res) => {
  const { event_id, status, count_only } = req.query;
  try {
    let query = `
      SELECT sr.*, 
             json_build_object('id', e.id, 'name', e.name) as events
      FROM situational_reports sr
      LEFT JOIN events e ON sr.event_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id && event_id !== 'all') {
      params.push(event_id);
      query += ` AND sr.event_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND sr.status = $${params.length}`;
    }

    // Provincial-level scoping
    const isRegional = ['Regional Admin', 'Regional', 'Super Admin', 'Regional Approver'].includes(req.user.account_type) || req.user.role === 'Super Admin';
    if (!isRegional && req.user.province) {
      params.push(req.user.province);
      query += ` AND (sr.province = $${params.length} OR sr.province IS NULL)`;
    }

    if (count_only === 'true') {
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS sub`;
      const { rows } = await pool.query(countQuery, params);
      return res.json({ count: parseInt(rows[0].count) });
    }

    query += ' ORDER BY sr.created_at DESC, sr.report_number DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[SitReps/GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/situational-reports/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM situational_reports WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[SitReps/GET/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/situational-reports
router.post('/', authenticate, async (req, res) => {
  console.log('[SitReps/POST] Request received. Body:', req.body);
  const { event_id, title, target_lgus, pinged_report_types, province } = req.body;
  const user = req.user;
  let totalCloned = 0;
  try {
    // Get next report number
    const countRes = await pool.query(
      'SELECT COALESCE(MAX(report_number), 0) AS max_num FROM situational_reports WHERE event_id = $1',
      [event_id]
    );
    const nextNumber = parseInt(countRes.rows[0].max_num) + 1;
    const finalTitle = title || `Situational Report No. ${nextNumber}`;

    const { rows } = await pool.query(
      `INSERT INTO situational_reports (event_id, report_number, title, target_lgus, province, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_id, nextNumber, finalTitle, target_lgus || [], province || user.province || null, user.id]
    );

    const sitRep = rows[0];

    // Update pinged_report_types on the event
    if (pinged_report_types && pinged_report_types.length > 0) {
      await pool.query(
        'UPDATE events SET pinged_report_types = $1 WHERE id = $2',
        [JSON.stringify(pinged_report_types), event_id]
      );
    }

    // Notify targeted LGU users
    if (target_lgus && target_lgus.length > 0) {
      const normalizedCities = target_lgus.map(c => c.includes(' (') ? c.split(' (')[0] : c);
      const lguUsersRes = await pool.query(
        `SELECT id, city, province FROM users WHERE account_type = 'LGU' AND city = ANY($1::text[]) AND province = $2`,
        [normalizedCities, user.province]
      );

      if (lguUsersRes.rows.length > 0) {
        const notifValues = lguUsersRes.rows.map(u => [
          u.id, 'sitrep_assignment', 'New Situational Report',
          `A new situational report "${finalTitle}" has been created for your LGU.`,
          JSON.stringify({ sitrep_id: sitRep.id, event_id, created_at: new Date().toISOString() })
        ]);

        for (const n of notifValues) {
          await pool.query(
            'INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1,$2,$3,$4,$5)',
            n
          );
        }

        // Auto-deploy LGUs to the event
        for (const u of lguUsersRes.rows) {
          await pool.query(
            `INSERT INTO event_deployments (event_id, city, province, deployed_by, strength_label, strength_value)
             VALUES ($1,$2,$3,$4,'Standard',1) ON CONFLICT (event_id, city) DO NOTHING`,
            [event_id, u.city, u.province || user.province, user.id]
          );
        }
      }
    }

    // --- Clone data from a previous SitRep if requested ---
    const { copy_from_id } = req.body;
    console.log('[SitReps/POST] copy_from_id received:', copy_from_id);
    if (copy_from_id) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        console.log('[SitReps/POST] Starting clone from', copy_from_id, 'to', sitRep.id);

        // Tables to clone directly (have situational_report_id FK, no parent dependency)
        const simpleTables = [
          'related_incidents',
          'agriculture_damage_reports',
          'assistance_lgus_agencies_reports',
          'assistance_provided_reports',
          'class_suspension_reports',
          'communication_lines_reports',
          'damaged_houses_reports',
          'declaration_state_of_calamity_reports',
          'infrastructure_damage_reports',
          'power_reports',
          'pre_emptive_evacuation_reports',
          'roads_and_bridges',
          'water_supply_reports',
          'work_suspension_reports',
        ];



        for (const table of simpleTables) {
          const { rows: sourceRows } = await client.query(
            `SELECT * FROM ${table} WHERE situational_report_id = $1::uuid`,
            [copy_from_id]
          );
          
          if (sourceRows.length > 0) {
            console.log(`[SitReps/POST] Cloning ${sourceRows.length} rows from table: ${table}`);
            totalCloned += sourceRows.length;
            for (const row of sourceRows) {
              const cols = Object.keys(row).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
              const values = cols.map(k => k === 'situational_report_id' ? sitRep.id : row[k]);
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              await client.query(
                `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
                values
              );
            }
          } else {
            // Optional: Log which tables are empty for debugging
            // console.log(`[SitReps/POST] Table ${table} is empty for source report.`);
          }
        }

        // Clone 'reports' (Affected Population) and their child 'report_rows'
        const { rows: sourceReports } = await client.query(
          `SELECT * FROM reports WHERE situational_report_id = $1::uuid`,
          [copy_from_id]
        );
        
        if (sourceReports.length > 0) {
          console.log(`[SitReps/POST] Cloning ${sourceReports.length} reports`);
          totalCloned += sourceReports.length;
          for (const report of sourceReports) {
            const rCols = Object.keys(report).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
            const rVals = rCols.map(k => k === 'situational_report_id' ? sitRep.id : report[k]);
            const rPlaceholders = rVals.map((_, i) => `$${i + 1}`).join(', ');
            const { rows: newReportRows } = await client.query(
              `INSERT INTO reports (${rCols.join(', ')}) VALUES (${rPlaceholders}) RETURNING id`,
              rVals
            );
            const newReportId = newReportRows[0].id;

            const { rows: sourceReportRows } = await client.query(
              `SELECT * FROM report_rows WHERE report_id = $1::uuid`,
              [report.id]
            );
            if (sourceReportRows.length > 0) {
              console.log(`[SitReps/POST] Cloning ${sourceReportRows.length} report_rows for report ${report.id}`);
              for (const rrow of sourceReportRows) {
                const rrCols = Object.keys(rrow).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
                const rrVals = rrCols.map(k => k === 'report_id' ? newReportId : rrow[k]);
                const rrPlaceholders = rrVals.map((_, i) => `$${i + 1}`).join(', ');
                await client.query(
                  `INSERT INTO report_rows (${rrCols.join(', ')}) VALUES (${rrPlaceholders})`,
                  rrVals
                );
              }
            }
          }
        }

        await client.query('COMMIT');
        console.log(`[SitReps/POST] Data inheritance completed. Total items cloned: ${totalCloned}`);
      } catch (cloneErr) {
        await client.query('ROLLBACK');
        console.error('[SitReps/POST] Cloning failed, rolled back:', cloneErr);
      } finally {
        client.release();
      }
    } else {
      console.log('[SitReps/POST] No copy_from_id provided, skipping inheritance.');
    }

    const io = req.app.locals.io;
    io.emit('sitrep:created', sitRep);

    res.status(201).json({ 
      ...sitRep, 
      debug_cloned_count: typeof totalCloned !== 'undefined' ? totalCloned : 0 
    });
  } catch (err) {
    console.error('[SitReps/POST]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/situational-reports/:id
router.patch('/:id', authenticate, async (req, res) => {
  const { title, target_lgus, status, rejection_remarks, approved_pdf_url, pending_pdf_url, summary } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE situational_reports SET
        title = COALESCE($1, title),
        target_lgus = COALESCE($2, target_lgus),
        status = COALESCE($3, status),
        rejection_remarks = COALESCE($4, rejection_remarks),
        approved_pdf_url = COALESCE($5, approved_pdf_url),
        pending_pdf_url = COALESCE($6, pending_pdf_url),
        summary = COALESCE($7, summary)
       WHERE id = $8 RETURNING *`,
      [title, target_lgus, status, rejection_remarks, approved_pdf_url, pending_pdf_url, summary, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });

    const io = req.app.locals.io;
    io.emit('sitrep:updated', rows[0]);

    res.json(rows[0]);
  } catch (err) {
    console.error('[SitReps/PATCH]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/situational-reports/:id/report-data  – all 13 sub-tables for one SitRep
router.get('/:id/report-data', authenticate, async (req, res) => {
  const sitRepId = req.params.id;
  const event_id = req.query.event_id;
  try {
    const tables = [
      'related_incidents', 'agriculture_damage_reports', 'assistance_lgus_agencies_reports',
      'assistance_provided_reports', 'class_suspension_reports', 'communication_lines_reports',
      'damaged_houses_reports', 'declaration_state_of_calamity_reports',
      'infrastructure_damage_reports', 'power_reports', 'pre_emptive_evacuation_reports',
      'roads_and_bridges', 'water_supply_reports', 'work_suspension_reports',
      'reports'
    ];

    const results = {};
    await Promise.all(tables.map(async (table) => {
      let q = `SELECT * FROM ${table} WHERE situational_report_id = $1`;
      const params = [sitRepId];
      if (event_id) { q += ' AND event_id = $2'; params.push(event_id); }
      const { rows } = await pool.query(q, params);
      results[table] = rows;
    }));

    // Fetch report_rows for each report
    if (results.reports.length > 0) {
      const reportIds = results.reports.map(r => r.id);
      const { rows: reportRows } = await pool.query(
        'SELECT * FROM report_rows WHERE report_id = ANY($1::uuid[])',
        [reportIds]
      );
      results.report_rows = reportRows;
    } else {
      results.report_rows = [];
    }

    res.json(results);
  } catch (err) {
    console.error('[SitReps/report-data]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
