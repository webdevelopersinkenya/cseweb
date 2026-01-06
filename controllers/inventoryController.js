const inventoryModel = require("../models/inventory-model");
const utilities = require("../utilities/"); // Assuming utilities/index.js
const { body, validationResult } = require('express-validator'); // For server-side validation

/* ***************************
 * Build inventory by classification view (Existing function)
 ***************************** */
async function buildByClassificationName(req, res) {
  const classification_name = req.params.classificationName;
  const inventoryData = await inventoryModel.getInventoryByClassificationName(classification_name);

  if (inventoryData.length === 0) {
    const error = new Error(`No vehicles found for ${classification_name} classification.`);
    error.status = 404;
    throw error;
  }

  const gridHtml = await utilities.buildClassificationGrid(inventoryData);
  let nav = await utilities.getNav();

  res.render("inventory/classification", {
    title: `${classification_name} Vehicles`,
    nav,
    grid: gridHtml,
  });
}

/* ***************************
 * Build inventory item detail view (Existing function)
 ***************************** */
async function buildByInvId(req, res) {
  const inv_id = parseInt(req.params.invId);

  if (isNaN(inv_id)) {
    throw new Error("Invalid inventory ID provided.");
  }

  const vehicleData = await inventoryModel.getInventoryById(inv_id);

  if (!vehicleData) {
    const error = new Error("Vehicle Not Found");
    error.status = 404;
    throw error;
  }

  const detailHtml = await utilities.buildVehicleDetail(vehicleData);
  let nav = await utilities.getNav();

  res.render("inventory/detail", {
    title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
    nav,
    body: detailHtml,
  });
}

/* ***************************
 * Build Management View (Task 1)
 * Purpose: Renders the inventory management dashboard.
 * Route: /inv/
 ***************************** */
async function buildManagement(req, res) {
  let nav = await utilities.getNav();
  // buildClassificationList is needed for the 'add new inventory' form
  // It's passed here so it can be dynamically shown based on user choice
  const classificationList = await utilities.buildClassificationList(); // Build for the new inventory form dropdown
  res.render("inventory/management", {
    title: "Vehicle Management",
    nav,
    errors: null, // Initialize errors to null for fresh load
    classificationList, // Pass the classification dropdown HTML
  });
}

/* ***************************
 * Build Add Classification View (Task 2)
 * Purpose: Renders the form to add a new vehicle classification.
 * Route: /inv/add-classification
 ***************************** */
async function buildAddClassification(req, res) {
  let nav = await utilities.getNav();
  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null, // For validation errors
    classification_name: '', // Sticky input for new classification name
  });
}

/* ***************************
 * Process Add Classification (Task 2)
 * Purpose: Handles the submission of the add new classification form.
 * Route: POST /inv/add-classification
 ***************************** */
async function registerClassification(req, res) {
  let nav = await utilities.getNav();
  const { classification_name } = req.body;

  // Server-side validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: errors.array(), // Pass errors to view
      classification_name: classification_name, // Sticky input
    });
  }

  // Add to database
  try {
    const classificationResult = await inventoryModel.addClassification(classification_name);
    if (classificationResult) {
      req.flash("notice", `Classification "${classification_name}" successfully added.`);
      // Rebuild nav to include new classification immediately
      let newNav = await utilities.getNav();
      res.locals.nav = newNav; // Update res.locals.nav for immediate display on next render
      res.redirect("/inv/"); // Redirect to management view on success
    } else {
      req.flash("notice", "Sorry, adding the classification failed. Please try again.");
      res.status(500).render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null, // No specific validation errors, but a general failure
        classification_name: classification_name,
      });
    }
  } catch (error) {
    req.flash("notice", error.message); // Flash the specific error (e.g., "already exists")
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: [{ msg: error.message }], // Pass it as an array for consistent rendering
      classification_name: classification_name,
    });
  }
}

/* ***************************
 * Build Add Inventory View (Task 3)
 * Purpose: Renders the form to add a new vehicle to inventory.
 * Route: /inv/add-inventory
 ***************************** */
async function buildAddInventory(req, res) {
  let nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList(); // Get dynamic dropdown
  res.render("inventory/add-inventory", {
    title: "Add New Inventory Item",
    nav,
    classificationList, // Pass dropdown HTML
    errors: null,
    // Provide empty values for sticky inputs on first load
    inv_make: '', inv_model: '', inv_year: '', inv_description: '',
    inv_image: '/images/vehicles/no-image.png', // Default 'no image' path
    inv_thumbnail: '/images/vehicles/no-image-tn.png', // Default 'no image' thumbnail path
    inv_price: '', inv_miles: '', inv_color: '', classification_id: '',
  });
}

/* ***************************
 * Process Add Inventory (Task 3)
 * Purpose: Handles the submission of the add new inventory form.
 * Route: POST /inv/add-inventory
 ***************************** */
async function registerInventory(req, res) {
  let nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList(req.body.classification_id); // Build list with sticky selected option

  const {
    inv_make, inv_model, inv_year, inv_description, inv_image,
    inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
  } = req.body;

  // Server-side validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: errors.array(),
      inv_make, inv_model, inv_year, inv_description, inv_image,
      inv_thumbnail, inv_price, inv_miles, inv_color, classification_id, // Sticky inputs
    });
  }

  // Add to database
  try {
    const inventoryResult = await inventoryModel.addInventory(
      inv_make, inv_model, inv_year, inv_description, inv_image,
      inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    );

    if (inventoryResult) {
      req.flash("notice", `Vehicle "${inv_make} ${inv_model}" successfully added.`);
      // Rebuild nav bar if you add new classification
      // If you are only adding inventory, nav bar doesn't change unless new classification is added
      res.redirect("/inv/"); // Redirect to management view on success
    } else {
      req.flash("notice", "Sorry, adding the vehicle failed. Please try again.");
      res.status(500).render("inventory/add-inventory", {
        title: "Add New Inventory Item",
        nav,
        classificationList,
        errors: null,
        inv_make, inv_model, inv_year, inv_description, inv_image,
        inv_thumbnail, inv_price, inv_miles, inv_color, classification_id,
      });
    }
  } catch (error) {
    req.flash("notice", "An unexpected error occurred: " + error.message);
    res.status(500).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: null,
      inv_make, inv_model, inv_year, inv_description, inv_image,
      inv_thumbnail, inv_price, inv_miles, inv_color, classification_id,
    });
  }
}


module.exports = {
  buildByClassificationName,
  buildByInvId,
  buildManagement,        // Export new function for Task 1
  buildAddClassification, // Export new function for Task 2 (GET)
  registerClassification, // Export new function for Task 2 (POST)
  buildAddInventory,      // Export new function for Task 3 (GET)
  registerInventory,      // Export new function for Task 3 (POST)
};
