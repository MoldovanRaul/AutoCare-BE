const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Listen for connection success or failure
pool.connect()
  .then(() => {
    console.log('🟢 Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('🔴 Error connecting to PostgreSQL:', err.message);
  });

module.exports = pool;
