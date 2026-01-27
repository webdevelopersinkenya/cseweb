const express = require("express");
const router = new express.Router();
const inventoryController = require("../controllers/inventoryController");
const { body } = require('express-validator');

/* **************************************
 * Route to build inventory by classification view
 * URL: /inv/type/:classificationName
 * Publicly accessible
 **************************************/
router.get(
  "/type/:classificationName",
  inventoryController.buildByClassificationName
);

/* **************************************
 * Route to build single inventory item detail view
 * URL: /inv/detail/:invId
 * Publicly accessible
 **************************************/
router.get(
  "/detail/:invId",
  inventoryController.buildByInvId
);

/* **************************************
 * Route to build Management View (Task 2)
 * URL: /inv/
 * Accessible without login for testing
 **************************************/
router.get(
  "/",
  inventoryController.buildManagement
);

/* **************************************
 * Route to build Add New Classification View
 * URL: /inv/add-classification
 * Accessible without login for testing
 **************************************/
router.get(
  "/add-classification",
  inventoryController.buildAddClassification
);

/* **************************************
 * Route to Process Add New Classification (POST)
 * URL: /inv/add-classification
 * Keep login/account checks if desired
 **************************************/
router.post(
  "/add-classification",
  body("classification_name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Classification name is required.")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("Classification name cannot contain spaces or special characters."),
  inventoryController.registerClassification
);

/* **************************************
 * Route to build Add New Inventory View
 * URL: /inv/add-inventory
 * Accessible without login for testing
 **************************************/
router.get(
  "/add-inventory",
  inventoryController.buildAddInventory
);

/* **************************************
 * Route to Process Add New Inventory (POST)
 * URL: /inv/add-inventory
 * Keep login/account checks if desired
 **************************************/
router.post(
  "/add-inventory",
  body("inv_make")
    .trim()
    .isLength({ min: 3 }).withMessage("Make must be at least 3 characters."),
  body("inv_model")
    .trim()
    .isLength({ min: 3 }).withMessage("Model must be at least 3 characters."),
  body("inv_year")
    .trim()
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 }).withMessage("Year must be a valid 4-digit number."),
  body("inv_description")
    .trim()
    .isLength({ min: 10 }).withMessage("Description must be at least 10 characters."),
  body("inv_image")
    .trim()
    .isLength({ min: 6 }).withMessage("Image path is required."),
  body("inv_thumbnail")
    .trim()
    .isLength({ min: 6 }).withMessage("Thumbnail path is required."),
  body("inv_price")
    .trim()
    .isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("inv_miles")
    .trim()
    .isInt({ min: 0 }).withMessage("Mileage must be a positive integer."),
  body("inv_color")
    .trim()
    .isLength({ min: 3 }).withMessage("Color is required."),
  body("classification_id")
    .trim()
    .isInt({ min: 1 }).withMessage("Please select a classification."),
  inventoryController.registerInventory
);

module.exports = router;
