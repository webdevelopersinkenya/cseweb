const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // important for Render
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.query("SELECT NOW()")
  .then(res => console.log("Database connected. Current time:", res.rows[0].now))
  .catch(err => console.error("Database connection failed:", err.message));

module.exports = pool;
