const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model");
const utilities = require("../utilities");

const validate = {};

/* **********************************
 * Login Validation Rules
 ********************************** */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const account = await accountModel.getAccountByEmail(account_email);
        if (!account) throw new Error("Email address not found.");
      }),
    body("account_password")
      .trim()
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters."),
  ];
};

/* **********************************
 * Login Validation Check
 ********************************** */
validate.checkLoginData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: errors.array(),
      account_email: req.body.account_email,
      notice: req.flash("notice"),
    });
  }
  next();
};

/* **********************************
 * Registration Rules
 ********************************** */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .notEmpty()
      .withMessage("Please provide a first name."),
    body("account_lastname")
      .trim()
      .notEmpty()
      .withMessage("Please provide a last name."),
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const exists = await accountModel.checkExistingEmail(account_email);
        if (exists) throw new Error("Email already exists. Please login or use a different email.");
      }),
    body("account_password")
      .trim()
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters."),
  ];
};

/* **********************************
 * Registration Check
 ********************************** */
validate.checkRegData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    return res.status(400).render("account/register", {
      title: "Register",
      nav,
      errors: errors.array(),
      account_firstname: req.body.account_firstname,
      account_lastname: req.body.account_lastname,
      account_email: req.body.account_email,
    });
  }
  next();
};

/* **********************************
 * Account Update Rules
 ********************************** */
validate.updateAccountRules = () => {
  return [
    body("account_firstname")
      .trim()
      .notEmpty()
      .withMessage("Please provide a first name."),
    body("account_lastname")
      .trim()
      .notEmpty()
      .withMessage("Please provide a last name."),
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email, { req }) => {
        const currentAccount = req.session.account;
        if (!currentAccount) throw new Error("User session not found.");

        // Only check for email change
        if (account_email !== currentAccount.account_email) {
          const exists = await accountModel.checkExistingEmail(account_email);
          if (exists) throw new Error("Email already exists. Please use a different email.");
        }
      }),
  ];
};

/* **********************************
 * Account Update Check
 ********************************** */
validate.checkUpdateData = async (req, res, next) => {
  const errors = validationResult(req);
  const { account_firstname, account_lastname, account_email, account_id } = req.body;

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    req.flash("notice", "Please fix the errors below to update your account.");
    return res.status(400).render("account/update-account", {
      title: "Edit Account",
      nav,
      errors: errors.array(),
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }
  next();
};

/* **********************************
 * Password Rules
 ********************************** */
validate.changePasswordRules = () => {
  return [
    body("account_password")
      .trim()
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters."),
  ];
};

/* **********************************
 * Password Check
 ********************************** */
validate.checkPasswordData = async (req, res, next) => {
  const errors = validationResult(req);
  const accountData = req.session.account;

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    req.flash("notice", "Please fix the errors below to change your password.");
    return res.status(400).render("account/update-account", {
      title: "Edit Account",
      nav,
      errors: errors.array(),
      account_id: req.body.account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
    });
  }
  next();
};

module.exports = validate;
