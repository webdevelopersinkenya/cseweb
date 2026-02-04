const inventoryModel = require("../models/inventory-model");
const utilities = require("../utilities/");
const { body, validationResult } = require("express-validator");

/* ***************************
 * Build inventory by classification
 ***************************** */
async function buildByClassificationName(req, res, next) {
  try {
    const classificationName = req.params.classificationName;
    const data = await inventoryModel.getInventoryByClassificationName(classificationName);
    const vehicles = data.rows || [];
    const nav = await utilities.getNav();

    const gridHtml = vehicles.length
      ? await utilities.buildClassificationGrid(vehicles)
      : "<p class='notice'>No vehicles found for this classification.</p>";

    res.render("inventory/classification", {
      title: `${classificationName} Vehicles`,
      classificationName,
      nav,
      vehicles,
      grid: gridHtml,
      flashMessage: req.flash("notice")
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Build single inventory item detail view
 ***************************** */
async function buildByInvId(req, res, next) {
  try {
    const invId = parseInt(req.params.invId);
    if (isNaN(invId)) throw Object.assign(new Error("Invalid inventory ID"), { status: 400 });

    const vehicleData = await inventoryModel.getInventoryById(invId);
    if (!vehicleData) throw Object.assign(new Error("Vehicle Not Found"), { status: 404 });

    const nav = await utilities.getNav();

    res.render("inventory/detail", {
      title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
      nav,
      vehicleData,
      flashMessage: req.flash("notice")
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Management View (Dashboard)
 ***************************** */
async function buildManagement(req, res, next) {
  try {
    const nav = await utilities.getNav();
    const accountData = res.locals.accountData; // Employee/Admin info

    res.render("inventory/management", { // new EJS template
      title: "Inventory Management",
      nav,
      accountData,
      flashMessage: req.flash("notice")
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Add Classification View
 ***************************** */
async function buildAddClassification(req, res) {
  const nav = await utilities.getNav();

  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: [],
    classification_name: "",
    flashMessage: req.flash("notice")
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
    return res.status(400).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: errors.array(),
      classification_name,
      flashMessage: req.flash("notice")
    });
  }

  try {
    const result = await inventoryModel.addClassification(classification_name);

    if (result) {
      req.flash("notice", `Classification "${classification_name}" added successfully.`);
      return res.redirect("/inv/");
    }

    req.flash("notice", "Failed to add classification.");
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: [],
      classification_name,
      flashMessage: req.flash("notice")
    });
  } catch (error) {
    req.flash("notice", error.message);
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: [{ msg: error.message }],
      classification_name,
      flashMessage: req.flash("notice")
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
    errors: [],
    flashMessage: req.flash("notice"),
    inv_make: "",
    inv_model: "",
    inv_year: "",
    inv_description: "",
    inv_image: "no-image.png",
    inv_thumbnail: "no-image-tn.png",
    inv_price: "",
    inv_miles: "",
    inv_color: "",
    classification_id: ""
  });
}

/* ***************************
 * Process Add Inventory
 ***************************** */
async function registerInventory(req, res) {
  const nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList(req.body.classification_id);

  const {
    inv_make, inv_model, inv_year, inv_description,
    inv_image, inv_thumbnail, inv_price, inv_miles,
    inv_color, classification_id
  } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: errors.array(),
      flashMessage: req.flash("notice"),
      inv_make, inv_model, inv_year, inv_description,
      inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    });
  }

  try {
    const result = await inventoryModel.addInventory(
      inv_make, inv_model, inv_year, inv_description,
      inv_image, inv_thumbnail, inv_price, inv_miles,
      inv_color, classification_id
    );

    if (result) {
      req.flash("notice", `Vehicle "${inv_make} ${inv_model}" added successfully.`);
      return res.redirect("/inv/");
    }

    req.flash("notice", "Failed to add vehicle.");
    res.status(500).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: [],
      flashMessage: req.flash("notice"),
      inv_make, inv_model, inv_year, inv_description,
      inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
    });
  } catch (error) {
    req.flash("notice", "Unexpected error: " + error.message);
    res.status(500).render("inventory/add-inventory", {
      title: "Add New Inventory Item",
      nav,
      classificationList,
      errors: [],
      flashMessage: req.flash("notice"),
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
