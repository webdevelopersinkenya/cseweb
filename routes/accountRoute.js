const express = require("express");
const router = new express.Router();
const accountController = require("../controllers/accountController.js");
const utilities = require("../utilities/");
const regValidate = require("../middleware/validation");

/* **************************************
 * GET login view
 * URL: /account/login
 ***************************************/
router.get("/login", utilities.handleErrors(async (req, res) => {
  const nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    errors: [],
    account_email: "",           // <-- match your input name
    notice: req.flash("notice")  // <-- pass flash messages
  });
}));


/* **************************************
 * GET registration view
 * URL: /account/register
 * Always sends empty errors array if none exist
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
