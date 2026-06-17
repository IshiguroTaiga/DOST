const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST === 'host.docker.internal' ? 'localhost' : process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createTable() {
  const query = `
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
    );
  `;

  try {
    console.log('Creating monitoring_stations table...');
    await pool.query(query);
    console.log('✅ Table created or already exists.');
  } catch (err) {
    console.error('❌ Error creating table:', err);
  } finally {
    await pool.end();
  }
}

createTable();
