const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('[DB Init] Starting database verification and migration...');
  
  try {
    // 1. Ensure pgcrypto extension is active for gen_random_uuid()
    console.log('[DB Init] Enabling pgcrypto extension if not active...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    
    // 2. Ensure lgu_submissions table exists
    console.log('[DB Init] Ensuring lgu_submissions table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.lgu_submissions (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        situational_report_id UUID NOT NULL REFERENCES public.situational_reports(id) ON DELETE CASCADE,
        city TEXT NOT NULL,
        status TEXT DEFAULT 'Draft',
        rejection_remarks TEXT,
        submitted_by UUID REFERENCES public.users(id),
        approved_by UUID REFERENCES public.users(id),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT lgu_submissions_pkey PRIMARY KEY (id),
        CONSTRAINT lgu_submissions_unique UNIQUE (situational_report_id, city)
      )
    `);

    // 3. Ensure ai_summaries table exists
    console.log('[DB Init] Ensuring ai_summaries table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.ai_summaries (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        situational_report_id UUID NOT NULL REFERENCES public.situational_reports(id) ON DELETE CASCADE,
        summary_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT ai_summaries_pkey PRIMARY KEY (id)
      )
    `);

    // 4. Ensure situational_reports columns exist
    console.log('[DB Init] Checking situational_reports columns...');
    
    // summary column
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='situational_reports' AND column_name='summary') THEN
          ALTER TABLE public.situational_reports ADD COLUMN summary TEXT;
        END IF;
      END $$;
    `);

    // approved_by & approved_at columns
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='situational_reports' AND column_name='approved_by') THEN
          ALTER TABLE public.situational_reports ADD COLUMN approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='situational_reports' AND column_name='approved_at') THEN
          ALTER TABLE public.situational_reports ADD COLUMN approved_at TIMESTAMPTZ;
        END IF;
      END $$;
    `);

    // created_by column on users
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_by') THEN
          ALTER TABLE public.users ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // cloned_from_id, cloned_at, auto_cloned tracking columns
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='situational_reports' AND column_name='cloned_from_id') THEN
          ALTER TABLE public.situational_reports ADD COLUMN cloned_from_id UUID REFERENCES public.situational_reports(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='situational_reports' AND column_name='cloned_at') THEN
          ALTER TABLE public.situational_reports ADD COLUMN cloned_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='situational_reports' AND column_name='auto_cloned') THEN
          ALTER TABLE public.situational_reports ADD COLUMN auto_cloned BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // Index idx_sitrep_cloned_from
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sitrep_cloned_from ON public.situational_reports(cloned_from_id)');

    // 4.5. Ensure events columns exist (location, wind_gust, movement, coordinates)
    console.log('[DB Init] Checking events columns...');
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='location') THEN
          ALTER TABLE public.events ADD COLUMN location TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='wind_gust') THEN
          ALTER TABLE public.events ADD COLUMN wind_gust TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='movement') THEN
          ALTER TABLE public.events ADD COLUMN movement TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='coordinates') THEN
          ALTER TABLE public.events ADD COLUMN coordinates TEXT;
        END IF;
      END $$;
    `);

    // 4.6. Ensure report_rows columns exist (city, remarks)
    console.log('[DB Init] Checking report_rows columns...');
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='report_rows' AND column_name='city') THEN
          ALTER TABLE public.report_rows ADD COLUMN city TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='report_rows' AND column_name='remarks') THEN
          ALTER TABLE public.report_rows ADD COLUMN remarks TEXT DEFAULT '';
        END IF;
      END $$;
    `);

    // 4.7. Ensure evacuation_centers_reports table exists
    console.log('[DB Init] Ensuring evacuation_centers_reports table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.evacuation_centers_reports (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
        situational_report_id UUID REFERENCES public.situational_reports(id) ON DELETE CASCADE,
        city TEXT DEFAULT '',
        barangay TEXT DEFAULT '',
        evacuation_center_name TEXT DEFAULT '',
        evacuation_center_address TEXT DEFAULT '',
        inside_families_cum INTEGER DEFAULT 0,
        inside_families_now INTEGER DEFAULT 0,
        inside_persons_cum INTEGER DEFAULT 0,
        inside_persons_now INTEGER DEFAULT 0,
        origin_of_idps TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        remarks TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT evac_centers_pkey PRIMARY KEY (id)
      )
    `);

    // 5. Ensure monitoring_stations table exists
    console.log('[DB Init] Ensuring monitoring_stations table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.monitoring_stations (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        province TEXT NOT NULL,
        lgu TEXT NOT NULL,
        address TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        equipment_details JSONB DEFAULT '{}'::JSONB,
        photo_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT monitoring_stations_pkey PRIMARY KEY (id)
      )
    `);

    // Ensure photo_url column exists on monitoring_stations
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monitoring_stations' AND column_name='photo_url') THEN
          ALTER TABLE public.monitoring_stations ADD COLUMN photo_url TEXT;
        END IF;
      END $$;
    `);

    // 6. Seed Default Admin User if not exists
    console.log('[DB Init] Checking admin user...');
    const adminEmail = 'admin@proact.local';
    const adminPasswordHash = '$2a$12$4RFQwd9YewFlzqZW2y9et.E7eFxPsP5HmG5YsAs3HpruWhBh1Fpzu'; // Admin@1234
    
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      console.log(`[DB Init] Creating default admin user: ${adminEmail}`);
      await pool.query(`
        INSERT INTO users (
          email,
          first_name,
          last_name,
          role,
          status,
          account_type,
          password_hash,
          must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        adminEmail,
        'System',
        'Admin',
        'Super Admin',
        'Active',
        'Super Admin',
        adminPasswordHash,
        false
      ]);
      console.log('[DB Init] Admin user created successfully.');
    } else {
      console.log('[DB Init] Admin user already exists.');
    }

    // 7. Auto-seed default stations if monitoring_stations is empty
    const stationsCheck = await pool.query('SELECT COUNT(*) FROM monitoring_stations');
    const stationsCount = parseInt(stationsCheck.rows[0].count, 10);
    
    if (stationsCount === 0) {
      console.log('[DB Init] monitoring_stations table is empty. Seeding default stations...');
      const stationsPath = path.join(__dirname, 'data', 'default_stations.json');
      if (fs.existsSync(stationsPath)) {
        const defaultStations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
        
        // Batch insertion for speed and transaction safety
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const s of defaultStations) {
            await client.query(
              `INSERT INTO monitoring_stations (province, lgu, address, latitude, longitude, equipment_details, photo_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [s.province, s.lgu, s.address, s.latitude, s.longitude, JSON.stringify(s.equipment_details || {}), s.photo_url || null]
            );
          }
          await client.query('COMMIT');
          console.log(`[DB Init] Successfully seeded ${defaultStations.length} default monitoring stations.`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('[DB Init] Error insertion batch for stations:', err);
        } finally {
          client.release();
        }
      } else {
        console.warn(`[DB Init] Seeder file default_stations.json not found at ${stationsPath}`);
      }
    } else {
      console.log(`[DB Init] monitoring_stations table already contains ${stationsCount} records. Skipping seeder.`);
    }

    console.log('✅ [DB Init] Database initialization complete.');
  } catch (error) {
    console.error('❌ [DB Init] Critical database initialization error:', error);
    throw error;
  }
}

module.exports = { initDatabase };
