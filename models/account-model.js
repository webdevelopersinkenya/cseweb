const pool = require("../database");

/* *****************************
 * Add new account to database
 * ***************************** */
async function registerAccount(
  account_firstname,
  account_lastname,
  account_email,
  account_password
) {
  try {
    const sql =
      "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client')";
    return await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    ]);
  } catch (error) {
    console.error("registerAccount error:", error);
    if (error.code === '23505') {
        throw new Error("Email already exists. Please login or use a different email.");
    }
    throw new Error("Failed to register account.");
  }
}

/* *****************************
 * Check for existing email (for registration validation)
 * ***************************** */
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
 * Return account data using email address
 * ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const result = await pool.query(
      "SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1",
      [account_email]
    );
    return result.rows[0];
  } catch (error) {
    console.error("getAccountByEmail error: " + error);
    return null;
  }
}

/* *****************************
 * Return account data using account_id (Task 5)
 * ***************************** */
async function getAccountById(account_id) {
  try {
    const result = await pool.query(
      "SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_id = $1",
      [account_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("getAccountById error: " + error);
    return null;
  }
}

/* *****************************
 * Update account information (Task 5)
 * Purpose: Updates a client's first name, last name, and email.
 * ***************************** */
async function updateAccount(
  account_firstname,
  account_lastname,
  account_email,
  account_id
) {
  try {
    const sql = `
      UPDATE account SET
        account_firstname = $1,
        account_lastname = $2,
        account_email = $3
      WHERE account_id = $4
      RETURNING *`;
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("updateAccount error:", error);
    if (error.code === '23505') { // Unique constraint violation (e.g., email already exists)
      throw new Error("Email already exists. Please use a different email.");
    }
    throw new Error("Failed to update account information.");
  }
}

/* *****************************
 * Update account password (Task 5)
 * Purpose: Updates a client's hashed password.
 * ***************************** */
async function updatePassword(account_password, account_id) {
  try {
    const sql = `
      UPDATE account SET
        account_password = $1
      WHERE account_id = $2
      RETURNING *`;
    const result = await pool.query(sql, [
      account_password, // This should be the already hashed password
      account_id,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("updatePassword error:", error);
    throw new Error("Failed to update password.");
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
