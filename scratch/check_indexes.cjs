const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://proact_user:proact_secret@localhost:5434/proact'
});

async function checkIndexes() {
  try {
    const res = await pool.query(`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = 'situational_reports'
          AND ix.indisunique;
    `);
    console.log('Unique Indexes on situational_reports:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkIndexes();
