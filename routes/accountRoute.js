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
 ***************************************/
router.get("/register", utilities.handleErrors(accountController.buildRegister));

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
 * GET Account Update View (Task 5)
 * URL: /account/update
 * Purpose: Displays form for updating account profile information and changing password
 * Protected by checkLogin
 ***************************************/
router.get(
  "/update",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountUpdate)
);

/* **************************************
 * Process Account Profile Update (Task 5)
 * URL: /account/update (POST)
 * Purpose: Handles submission of account profile update form
 * Protected by checkLogin, includes validation middleware
 ***************************************/
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateAccountRules(), // Validation rules for profile update
  regValidate.checkUpdateData, // Check function for profile update
  utilities.handleErrors(accountController.updateAccount)
);

/* **************************************
 * Process Account Password Update (Task 5)
 * URL: /account/updatePassword (POST)
 * Purpose: Handles submission of password change form
 * Protected by checkLogin, includes validation middleware
 ***************************************/
router.post(
  "/updatePassword",
  utilities.checkLogin,
  regValidate.changePasswordRules(), // Validation rules for password change
  regValidate.checkPasswordData, // Check function for password change
  utilities.handleErrors(accountController.updatePassword)
);

/* **************************************
 * Process Logout (Task 6)
 * URL: /account/logout
 * Purpose: Clears JWT cookie and redirects to home
 ***************************************/
router.get("/logout", utilities.handleErrors(accountController.accountLogout));


module.exports = router;
