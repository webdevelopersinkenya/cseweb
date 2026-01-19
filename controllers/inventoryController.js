const inventoryModel = require("../models/inventory-model");
const utilities = require("../utilities/"); // utilities/index.js
const { body, validationResult } = require('express-validator');

/* ***************************
 * Build inventory by classification
 ***************************** */
async function buildByClassificationName(req, res, next) {
  try {
    const classification_name = req.params.classificationName;
    const data = await inventoryModel.getInventoryByClassificationName(classification_name);
    const vehicles = data.rows || []; // always array
    const nav = await utilities.getNav();

    // If no vehicles, show notice
    if (vehicles.length === 0) {
      return res.render("inventory/classification", {
        title: `${classification_name} Vehicles`,
        classificationName: classification_name,
        nav,
        vehicles,
        grid: "<p class='notice'>No vehicles found for this classification.</p>"
      });
    }

    // Build the vehicle grid
    const gridHtml = await utilities.buildClassificationGrid(vehicles);

    res.render("inventory/classification", {
      title: `${classification_name} Vehicles`,
      classificationName: classification_name,
      nav,
      vehicles,
      grid: gridHtml
    });

  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Build inventory item detail view
 ***************************** */
async function buildByInvId(req, res, next) {
  try {
    const inv_id = parseInt(req.params.invId);
    if (isNaN(inv_id)) throw Object.assign(new Error("Invalid inventory ID"), { status: 400 });

    const vehicleData = await inventoryModel.getInventoryById(inv_id);
    if (!vehicleData) throw Object.assign(new Error("Vehicle Not Found"), { status: 404 });

    const nav = await utilities.getNav();

    res.render("inventory/detail", {
      title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
      nav,
      vehicleData
    });

  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Management View
 ***************************** */
async function buildManagement(req, res) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList();

  res.render("inventory/management", {
    title: "Vehicle Management",
    nav,
    errors: null,
    classificationList
  });
}

/* ***************************
 * Add Classification View
 ***************************** */
async function buildAddClassification(req, res) {
  const nav = await utilities.getNav();

  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    classification_name: ''
  });
}

/* ***************************
 * Process Add Classification
 ***************************** */
async function registerClassification(req, res) {
  const nav = await utilities.getNav();
  const { classification_name } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: errors.array(),
      classification_name
    });
  }

  try {
    const result = await inventoryModel.addClassification(classification_name);
    if (result) {
      req.flash("notice", `Classification "${classification_name}" added successfully.`);
      return res.redirect("/inv/");
    } else {
      req.flash("notice", "Failed to add classification.");
      return res.status(500).render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null,
        classification_name
      });
    }
  } catch (error) {
    req.flash("notice", error.message);
    return res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: [{ msg: error.message }],
      classification_name
    });
  }
}

/* ***************************
 * Add Inventory View
 ***************************** */
async function buildAddInventory(req, res) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList();

  res.render("inventory/add-inventory", {
    title: "Add New Inventory Item",
    nav,
    classificationList,
    errors: null,
    inv_make: '', inv_model: '', inv_year: '', inv_description: '',
    inv_image: 'no-image.png',        // just filename
    inv_thumbnail: 'no-image-tn.png', // just filename
    inv_price: '', inv_miles: '', inv_color: '', classification_id: ''
  });
}

/* ***************************
 * Process Add Inventory
 ***************************** */
async function registerInventory(req, res) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList(req.body.classification_id);

  const {
    inv_make, inv_model, inv_year, inv_description, inv_image,
    inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
  } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: errors.array(),
      inv_make, inv_model, inv_year, inv_description,
      inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    });
  }

  try {
    const result = await inventoryModel.addInventory(
      inv_make, inv_model, inv_year, inv_description, inv_image,
      inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    );

    if (result) {
      req.flash("notice", `Vehicle "${inv_make} ${inv_model}" added successfully.`);
      return res.redirect("/inv/");
    } else {
      req.flash("notice", "Failed to add vehicle.");
      return res.status(500).render("inventory/add-inventory", {
        title: "Add New Inventory Item",
        nav,
        classificationList,
        errors: null,
        inv_make, inv_model, inv_year, inv_description,
        inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
      });
    }
  } catch (error) {
    req.flash("notice", "Unexpected error: " + error.message);
    return res.status(500).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: null,
      inv_make, inv_model, inv_year, inv_description,
      inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    });
  }
}

module.exports = {
  buildByClassificationName,
  buildByInvId,
  buildManagement,
  buildAddClassification,
  registerClassification,
  buildAddInventory,
  registerInventory
};
