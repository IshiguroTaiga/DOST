const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5434'),
  database: process.env.DB_NAME || 'proact',
  user: process.env.DB_USER || 'proact_user',
  password: process.env.DB_PASSWORD || 'proact_secret',
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Adding cyclone monitoring columns to events table...');
    await client.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS wind_gust TEXT,
      ADD COLUMN IF NOT EXISTS movement TEXT,
      ADD COLUMN IF NOT EXISTS coordinates TEXT;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
