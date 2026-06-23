const pool = require('../backend/src/db');
(async () => {
  try {
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Columns in users table:', columns);

    const { rows: users } = await pool.query("SELECT id, email, first_name, last_name, account_type, role, status FROM users");
    console.log('Users in database:', users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
