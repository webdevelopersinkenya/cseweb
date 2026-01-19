// fix-image-paths.js
const pool = require('./database'); // adjust the path to your database config

async function fixImagePaths() {
  try {
    // Select all vehicles first
    const result = await pool.query('SELECT inv_id, inv_image, inv_thumbnail FROM inventory');
    
    for (const row of result.rows) {
      let newImage = row.inv_image.replace('/vehicles/vehicles/', '/vehicles/');
      let newThumbnail = row.inv_thumbnail.replace('/vehicles/vehicles/', '/vehicles/');
      
      // Only update if something changed
      if (newImage !== row.inv_image || newThumbnail !== row.inv_thumbnail) {
        await pool.query(
          `UPDATE inventory 
           SET inv_image = $1, inv_thumbnail = $2 
           WHERE inv_id = $3`,
          [newImage, newThumbnail, row.inv_id]
        );
        console.log(`Updated vehicle ID ${row.inv_id}`);
      }
    }

    console.log('All paths normalized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating image paths:', error);
    process.exit(1);
  }
}

fixImagePaths();
