const express = require("express");
const router = new express.Router();
const accountController = require("../controllers/accountController.js");
const utilities = require("../utilities/");
const regValidate = require("../middleware/validation");

/* **************************************
 * GET login view
 * URL: /account/login
 ***************************************/
router.get("/login", utilities.handleErrors(accountController.buildLogin));

/* **************************************
 * GET registration view
 * URL: /account/register
 * Always sends empty errors array if none exist
 ***************************************/
router.get("/register", utilities.handleErrors(async (req, res, next) => {
    // Call your existing controller to get base data (if any)
    const data = await accountController.buildRegister(req, res);
    
    // Render the page safely with defaults
    res.render("account/register", {
        errors: data?.errors || [],      // default empty array
        username: data?.username || "",  // default empty string
        email: data?.email || ""         // default empty string
    });
}));

/* **************************************
 * Process Registration
 * URL: /account/register
 * Includes validation middleware
 ***************************************/
router.post(
  "/register",
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

/* **************************************
 * Process Login Request
 * URL: /account/login
 * Includes validation middleware and points to accountLogin controller
 ***************************************/
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

/* **************************************
 * GET Account Management View
 * URL: /account/
 * Purpose: Displays client's account dashboard after login
 * Applies checkLogin middleware to protect this route.
 ***************************************/
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
);

/* **************************************
 * GET Account Update View
 * URL: /account/update
 ***************************************/
router.get(
  "/update",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountUpdate)
);

/* **************************************
 * Process Account Profile Update (Task 5)
 * URL: /account/update (POST)
 ***************************************/
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateAccountRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
);

/* **************************************
 * Process Account Password Update (Task 5)
 * URL: /account/updatePassword (POST)
 ***************************************/
router.post(
  "/updatePassword",
  utilities.checkLogin,
  regValidate.changePasswordRules(),
  regValidate.checkPasswordData,
  utilities.handleErrors(accountController.updatePassword)
);

/* **************************************
 * Process Logout (Task 6)
 * URL: /account/logout
 ***************************************/
router.get("/logout", utilities.handleErrors(accountController.accountLogout));

module.exports = router;
