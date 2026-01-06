const db = require('../database/db') // your DB connection

exports.insertClassification = async (classification_name) => {
  try {
    const sql = 'INSERT INTO classification (classification_name) VALUES ($1)'
    await db.query(sql, [classification_name])
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false }
  }
}
