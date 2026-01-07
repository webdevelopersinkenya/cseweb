const express = require('express');
const router = express.Router();      // <-- THIS WAS MISSING
const invModel = require('../models/inventory-model'); // adjust path if needed

// Route: Fetch vehicles by classification name (case-insensitive)
router.get('/inv/type/:classificationName', async (req, res) => {
  const classificationName = req.params.classificationName;

  try {
    const vehicles = await invModel.getInventoryByClassificationName(classificationName);

    res.render('vehicles', {
      vehicles,
      message: vehicles.length === 0 ? `No vehicles found for ${classificationName} classification.` : null,
      classificationName
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching vehicles.');
  }
});

module.exports = router;
