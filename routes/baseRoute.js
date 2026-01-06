const express = require("express");
const router = express.Router();
const baseController = require("../controllers/baseController");
const utilities = require("../utilities/"); // For handleErrors

/* **************************************
 * GET home route
 * '/'
 * Uses baseController.buildHome to render the home page
 ***************************************/
router.get("/", utilities.handleErrors(baseController.buildHome));

/* **************************************
 * Route to intentionally trigger a 500 error (Task 3)
 * URL: /trigger-error
 ***************************************/
router.get("/trigger-error", utilities.handleErrors(async (req, res, next) => {
    // Intentionally cause an error (e.g., trying to access a non-existent property of null)
    let nonExistentVariable = null;
    console.log(nonExistentVariable.property); // This will throw a TypeError, caught by handleErrors
}));

module.exports = router;
