const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://proact_user:proact_secret@localhost:5434/proact'
});

async function checkConstraints() {
  try {
    const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND contype = 'u';
    `);
    console.log('Unique Constraints:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkConstraints();
