const pool = require("../database"); // PostgreSQL connection

/* *****************************
 * Register a new account
 ***************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    const sql = `
      INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_password]);
    return result.rows[0];
  } catch (error) {
    console.error("registerAccount error:", error);
    if (error.code === '23505') {
      throw new Error("Email already exists. Please login or use a different email.");
    }
    throw new Error("Failed to register account.");
  }
}

/* *****************************
 * Check if an email already exists
 ***************************** */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT COUNT(*) FROM account WHERE account_email = $1";
    const result = await pool.query(sql, [account_email]);
    return result.rows[0].count > 0;
  } catch (error) {
    console.error("checkExistingEmail error:", error);
    throw new Error("Failed to check existing email.");
  }
}

/* *****************************
 * Get account by email
 ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `
      SELECT account_id, account_firstname, account_lastname, account_email, account_password
      FROM account
      WHERE account_email = $1
    `;
    const result = await pool.query(sql, [account_email]);
    return result.rows[0];
  } catch (error) {
    console.error("getAccountByEmail error:", error);
    return null;
  }
}

/* *****************************
 * Get account by ID
 ***************************** */
async function getAccountById(account_id) {
  try {
    const sql = `
      SELECT account_id, account_firstname, account_lastname, account_email, account_password
      FROM account
      WHERE account_id = $1
    `;
    const result = await pool.query(sql, [account_id]);
    return result.rows[0];
  } catch (error) {
    console.error("getAccountById error:", error);
    return null;
  }
}

/* *****************************
 * Update account info
 ***************************** */
async function updateAccount({ account_id, account_firstname, account_lastname, account_email }) {
  try {
    const sql = `
      UPDATE account
      SET account_firstname = $1,
          account_lastname = $2,
          account_email = $3
      WHERE account_id = $4
      RETURNING *;
    `;
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_id]);
    return result.rows[0]; // return the updated account
  } catch (error) {
    console.error("updateAccount error:", error);
    throw error;
  }
}

/* *****************************
 * Update password
 ***************************** */
async function updatePassword(account_id, hashedPassword) {
  try {
    const sql = `
      UPDATE account
      SET account_password = $1
      WHERE account_id = $2
      RETURNING *;
    `;
    const result = await pool.query(sql, [hashedPassword, account_id]);
    return result.rows[0];
  } catch (error) {
    console.error("updatePassword error:", error);
    throw error;
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
};
