// create-admin.js
require("dotenv").config();
const pool = require("./database"); // your database connection
const bcrypt = require("bcryptjs");
async function createAdmin() {
  try {
    // --- Admin details ---
    const first_name = "Admin";
    const last_name = "User";
    const email = "admin@example.com"; // change to your preferred email
    const password = "Admin1234";      // change to your preferred password
    const account_type = "Admin";

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const query = `
      INSERT INTO accounts (first_name, last_name, email, password, account_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING account_id, email, account_type;
    `;
    const values = [first_name, last_name, email, hashedPassword, account_type];

    const result = await pool.query(query, values);

    console.log(" Admin account created successfully:");
    console.log(result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating Admin account:", err.message);
    process.exit(1);
  }
}

createAdmin();
