// routes/accountRoute.js

const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");
const regValidate = require("../middleware/account-validation"); // Make sure this path matches your folder structure
const accountModel = require("../models/account-model"); // <-- add this

// Middleware to prevent logged-in users from accessing login/register
const { checkLogin, checkLogout } = require("../utilities");

/* **************************************
 * GET login view
 * Only accessible if logged out
 **************************************/
router.get(
  "/login",
  checkLogout,
  utilities.handleErrors(accountController.buildLogin)
);

/* **************************************
 * GET registration view
 * Only accessible if logged out
 **************************************/
router.get(
  "/register",
  checkLogout,
  utilities.handleErrors(accountController.buildRegister)
);

/* **************************************
 * Process Registration
 * URL: /account/register
 * Includes validation middleware
 **************************************/
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

/* **************************************
 * Process Login Request
 * URL: /account/login
 **************************************/
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

/* **************************************
 * GET Account Management View
 * Protected route (must be logged in)
 **************************************/
router.get(
  "/",
  checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
);

/* **************************************
 * GET Account Update View (all users)
 **************************************/
router.get(
  "/update",
  checkLogin,
  utilities.handleErrors(async (req, res) => {
    const accountData = req.session.accountData;

    if (!accountData) {
      // Fallback: send an empty object so EJS doesn't crash
      return res.render("account/update-account", {
        title: "Update Account",
        errors: null,
        account: {}, // <-- must pass something
        notice: req.flash("notice")
      });
    }

    res.render("account/update-account", {
      title: "Update Account",
      errors: null,
      account: accountData, // <-- this is your real data
      notice: req.flash("notice")
    });
  })
);

/* **************************************
 * GET Account Update by ID (optional, admin maybe)
 **************************************/
router.get(
  "/update/:account_id",
  checkLogin,
  utilities.handleErrors(accountController.buildUpdateAccount)
);

/* **************************************
 * POST Account Profile Update
 **************************************/
// Process Account Profile Update
router.post(
  "/update",
  checkLogin,                       
  regValidate.updateAccountRules(),  
  regValidate.checkUpdateData,       
  utilities.handleErrors(accountController.updateAccount) 
);

/* **************************************
 * POST Account Password Update
 **************************************/
// Process Account Password Update
router.post(
  "/updatePassword",
  checkLogin,                     // make sure user is logged in
  regValidate.changePasswordRules(), // password validation rules
  regValidate.checkPasswordData,      // validation check
  utilities.handleErrors(accountController.updatePassword) // controller function
);

/* **************************************
 * Logout
 * Clears session and JWT cookie, redirects home
 **************************************/
router.get(
  "/logout",
  utilities.handleErrors(accountController.accountLogout)
);

module.exports = router;
