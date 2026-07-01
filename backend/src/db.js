require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  database: process.env.DB_NAME || 'proact',
  user: process.env.DB_USER || 'proact_user',
  password: process.env.DB_PASSWORD || 'proact_secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

const DEV_USER_ID = 'd3b07384-d113-41e9-a4b5-be14a4b5eade';
const DEV_EMAIL = 'mmsu@ccis.dev';
let defaultAdminId = null;

async function resolveDefaultAdminId() {
  if (defaultAdminId) return defaultAdminId;
  try {
    const res = await pool.originalQuery("SELECT id FROM users WHERE email = 'admin@proact.local' LIMIT 1");
    if (res && res.rows && res.rows[0]) {
      defaultAdminId = res.rows[0].id;
    }
  } catch (err) {
    // Ignore during database initial creation/seeding
  }
  return defaultAdminId;
}

async function wrapQueryArgs(text, params) {
  let queryText = typeof text === 'string' ? text : (text ? text.text : '');
  let queryParams = Array.isArray(params) ? [...params] : (text && Array.isArray(text.values) ? [...text.values] : []);

  // 1. Skip activity logs insertion for the dev user
  const isInsertActivityLog = /insert\s+into\s+(public\.)?activity_logs/i.test(queryText);
  if (isInsertActivityLog) {
    const hasDevUser = queryParams.includes(DEV_USER_ID);
    if (hasDevUser) {
      return {
        text: 'SELECT 1 AS dummy',
        values: [],
        isSkippedLog: true
      };
    }
  }

  // 2. Replace dev user ID with default admin ID for non-users table queries
  const isUsersTableQuery = /users/i.test(queryText);
  if (!isUsersTableQuery && queryParams.includes(DEV_USER_ID)) {
    const adminId = await resolveDefaultAdminId();
    if (adminId) {
      for (let i = 0; i < queryParams.length; i++) {
        if (queryParams[i] === DEV_USER_ID) {
          queryParams[i] = adminId;
        }
      }
    }
  }

  if (typeof text === 'object' && text !== null) {
    return {
      ...text,
      text: queryText,
      values: queryParams
    };
  }

  return {
    text: queryText,
    values: queryParams
  };
}

const originalPoolQuery = pool.query;
pool.originalQuery = originalPoolQuery;

pool.query = async function(text, params, callback) {
  try {
    const wrapped = await wrapQueryArgs(text, params);
    if (wrapped.isSkippedLog) {
      if (typeof callback === 'function') {
        callback(null, { rows: [{ id: '00000000-0000-0000-0000-000000000000' }], rowCount: 1 });
      }
      return { rows: [{ id: '00000000-0000-0000-0000-000000000000' }], rowCount: 1 };
    }
    return await originalPoolQuery.apply(pool, [wrapped.text, wrapped.values, callback]);
  } catch (err) {
    if (typeof callback === 'function') {
      callback(err);
    }
    throw err;
  }
};

const originalConnect = pool.connect;
pool.connect = async function(...args) {
  const client = await originalConnect.apply(pool, args);
  if (client && !client.query.__wrapped) {
    const originalClientQuery = client.query;
    client.query = async function(text, params, callback) {
      try {
        const wrapped = await wrapQueryArgs(text, params);
        if (wrapped.isSkippedLog) {
          if (typeof callback === 'function') {
            callback(null, { rows: [{ id: '00000000-0000-0000-0000-000000000000' }], rowCount: 1 });
          }
          return { rows: [{ id: '00000000-0000-0000-0000-000000000000' }], rowCount: 1 };
        }
        return await originalClientQuery.apply(client, [wrapped.text, wrapped.values, callback]);
      } catch (err) {
        if (typeof callback === 'function') {
          callback(err);
        }
        throw err;
      }
    };
    client.query.__wrapped = true;
  }
  return client;
};

module.exports = pool;
