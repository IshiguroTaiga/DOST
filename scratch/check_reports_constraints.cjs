const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://proact_user:proact_secret@localhost:5434/proact'
});

async function checkReportsConstraints() {
  try {
    const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE n.nspname = 'public' AND t.relname = 'reports' AND contype = 'u';
    `);
    console.log('Unique Constraints on reports:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkReportsConstraints();
