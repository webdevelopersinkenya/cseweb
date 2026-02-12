const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");
const regValidate = require("../middleware/account-validation");

// Middleware to prevent logged-in users from accessing login/register
const { checkLogin, checkLogout } = require("../utilities");

/* **************************************
 * Login & Registration Routes
 **************************************/
router.get("/login", checkLogout, utilities.handleErrors(accountController.buildLogin));
router.get("/register", checkLogout, utilities.handleErrors(accountController.buildRegister));

router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

/* **************************************
 * Account Dashboard
 **************************************/
router.get("/", checkLogin, utilities.handleErrors(accountController.buildAccountManagement));

/* **************************************
 * Account Update Form (GET)
 **************************************/
router.get("/update", checkLogin, utilities.handleErrors(accountController.buildUpdateAccount));

/* **************************************
 * Account Profile Update (POST)
 **************************************/
router.post(
  "/update",
  checkLogin,
  regValidate.updateAccountRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
);

/* **************************************
 * Account Password Update (POST)
 **************************************/
router.post(
  "/updatePassword",
  checkLogin,
  regValidate.changePasswordRules(),
  regValidate.checkPasswordData,
  utilities.handleErrors(accountController.updatePassword)
);

/* **************************************
 * Logout
 **************************************/
router.get("/logout", utilities.handleErrors(accountController.accountLogout));

module.exports = router;
