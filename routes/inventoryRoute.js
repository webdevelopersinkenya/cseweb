const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { body } = require("express-validator");
const utilities = require("../utilities/");

/* **************************************
 * PUBLIC ROUTES (NO LOGIN REQUIRED)
 **************************************/

// Inventory management dashboard
router.get(
  "/",
  //utilities.checkJWTToken,
  //utilities.checkAccountType,
  utilities.handleErrors(inventoryController.buildManagement)
);

// View inventory by classification
router.get(
  "/type/:classificationName",
  //utilities.checkJWTToken,
  //utilities.checkAccountType,
  utilities.handleErrors(inventoryController.buildByClassificationName)
);

// View single inventory item
router.get(
  "/detail/:invId",
  //utilities.checkJWTToken,
  //utilities.checkAccountType,
  utilities.handleErrors(inventoryController.buildByInvId)
);

/* **************************************
 * CLASSIFICATION ROUTES (OPEN FOR NOW)
 **************************************/

// Add classification form
router.get(
  "/add-classification",
  //utilities.checkJWTToken,
  //utilities.checkAccountType,
  utilities.handleErrors(inventoryController.buildAddClassification)
);

// Process add classification
router.post(
  "/add-classification",
  body("classification_name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Classification name is required.")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("No spaces or special characters."),
  utilities.handleErrors(inventoryController.registerClassification)
);

/* **************************************
 * INVENTORY ROUTES (OPEN FOR NOW)
 **************************************/

const inventoryValidationRules = [
  body("inv_make").trim().isLength({ min: 3 }),
  body("inv_model").trim().isLength({ min: 3 }),
  body("inv_year").isInt({ min: 1900, max: new Date().getFullYear() + 2 }),
  body("inv_description").trim().isLength({ min: 10 }),
  body("inv_image").trim().isLength({ min: 6 }),
  body("inv_thumbnail").trim().isLength({ min: 6 }),
  body("inv_price").isFloat({ min: 0 }),
  body("inv_miles").isInt({ min: 0 }),
  body("inv_color").trim().isLength({ min: 3 }),
  body("classification_id").isInt({ min: 1 })
];

// Add inventory form
router.get(
  "/add-inventory",
  utilities.handleErrors(inventoryController.buildAddInventory)
);

// Process add inventory
router.post(
  "/add-inventory",
  inventoryValidationRules,
  utilities.handleErrors(inventoryController.registerInventory)
);

module.exports = router;
