const pool = require("../database");

/* ***************************
 * Get inventory item by inv_id
 * Parameterized statement
 ***************************** */
async function getInventoryById(inv_id) {
  try {
    const data = await pool.query(
      "SELECT * FROM inventory LEFT JOIN classification ON inventory.classification_id = classification.classification_id WHERE inv_id = $1",
      [inv_id]
    );
    return data.rows[0];
  } catch (error) {
    console.error("getInventoryById error: " + error);
    throw new Error("Failed to get inventory item by ID.");
  }
}

/* ***************************
 * Get all inventory items for a specific classification
 * Purpose: Retrieves all vehicles belonging to a given classification.
 * Parameterized statement to prevent SQL Injection.
 ***************************** */
async function getInventoryByClassificationName(classification_name) {
  try {
    const data = await pool.query(
      `SELECT * FROM inventory
       LEFT JOIN classification ON inventory.classification_id = classification.classification_id
       WHERE classification.classification_name = $1`,
      [classification_name]
    );
    return data.rows;
  } catch (error) {
    console.error("getInventoryByClassificationName error: " + error);
    throw new Error("Failed to get inventory items by classification name.");
  }
}

/* ***************************
 * Get all classifications
 * Purpose: Retrieves all classification names and IDs from the database.
 * Used for building the classification dropdown.
 ***************************** */
async function getClassifications() {
  try {
    const data = await pool.query(
      "SELECT * FROM classification ORDER BY classification_name"
    );
    return data.rows;
  } catch (error) {
    console.error("getClassifications error: " + error);
    throw new Error("Failed to get classifications.");
  }
}

/* ***************************
 * Add new classification
 * Purpose: Inserts a new classification into the database.
 * Parameterized statement.
 ***************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *";
    const result = await pool.query(sql, [classification_name]);
    return result.rows[0]; // Return the inserted classification object
  } catch (error) {
    // If classification already exists due to UNIQUE constraint, catch that specific error
    if (error.code === '23505') { // PostgreSQL unique violation error code
      throw new Error(`Classification '${classification_name}' already exists.`);
    }
    console.error("addClassification error: " + error);
    throw new Error("Failed to add new classification to database.");
  }
}

/* ***************************
 * Add new inventory item
 * Purpose: Inserts a new vehicle into the inventory table.
 * Parameterized statement.
 ***************************** */
async function addInventory(
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id
) {
  try {
    const sql = `
      INSERT INTO inventory (
        inv_make, inv_model, inv_year, inv_description, inv_image,
        inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
    const result = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    ]);
    return result.rows[0]; // Return the inserted inventory item
  } catch (error) {
    console.error("addInventory error: " + error);
    throw new Error("Failed to add new inventory item to database.");
  }
}

module.exports = {
  getInventoryById,
  getInventoryByClassificationName,
  getClassifications, // Export new function
  addClassification,  // Export new function
  addInventory,       // Export new function
};
