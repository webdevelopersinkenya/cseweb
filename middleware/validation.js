const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model"); // Assuming you have an account model for DB checks
const utilities = require("../utilities/"); // Assuming utilities are available for nav and error handling

const validate = {}; // Create a validation object

/* **********************************
 * Login Data Validation Rules
 * ********************************* */
validate.loginRules = () => {
  return [
    // email is required and must be a valid email
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail() // sanitize email
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        // Check if email exists in database
        const account = await accountModel.getAccountByEmail(account_email);
        if (!account) {
          throw new Error("Email address not found.");
        }
      }),

    // password is required and must meet requirements
    body("account_password")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Password must be at least 10 characters.")
      .matches(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{10,}$/
      )
      .withMessage(
        "Password must contain at least 1 uppercase, 1 number, and 1 special character."
      ),
  ];
};

/* ***********************************
 * Check Login Data
 * Purpose: Checks data from login form and returns errors or passes to controller.
 * ********************************* */
validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body;
  let errors = [];
  errors = validationResult(req); // Collects validation errors

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav(); // Assuming utilities are available globally or imported
    req.flash("notice", "Please fix the errors below.");
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: errors.array(), // Pass errors to the view
      account_email, // Keep email sticky
    });
    return; // Stop execution if errors
  }
  next(); // No errors, proceed to next middleware/controller
};

/* **********************************
 * Registration Data Validation Rules
 * ********************************* */
validate.registationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),
    body("account_lastname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a last name."),
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email);
        if (emailExists) {
          throw new Error("Email already exists. Please login or use a different email.");
        }
      }),
    body("account_password")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Password must be at least 10 characters.")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{10,}$/)
      .withMessage("Password must contain at least 1 uppercase, 1 number, and 1 special character."),
  ];
};

/* ***********************************
 * Check Registration Data
 * ********************************* */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  let errors = [];
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    res.render("account/register", {
      errors,
      title: "Registration",
      nav,
      account_firstname,
      account_lastname,
      account_email,
    });
    return;
  }
  next();
};

/* **********************************
 * Account Update Data Validation Rules (Task 5)
 * ********************************* */
validate.updateAccountRules = () => {
    return [
        // Account Firstname is required and must not be empty
        body("account_firstname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name."),

        // Account Lastname is required and must not be empty
        body("account_lastname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a last name."),

        // Account Email is required, valid email, and must not already exist (excluding current user's email)
        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required.")
            .custom(async (account_email, { req }) => {
                const account_id = res.locals.accountData.account_id; // Get current account_id from locals
                const account = await accountModel.getAccountById(account_id); // Get current account data
                // Only check if email exists if it's different from the current email
                if (account_email !== account.account_email) {
                    const emailExists = await accountModel.checkExistingEmail(account_email);
                    if (emailExists) {
                        throw new Error("Email address already exists. Please use a different email.");
                    }
                }
            }),
    ];
};

/* ***********************************
 * Check Account Update Data (Task 5)
 * ********************************* */
validate.checkUpdateData = async (req, res, next) => {
    const { account_firstname, account_lastname, account_email, account_id } = req.body;
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        req.flash("notice", "Please fix the errors below to update your account.");
        res.status(400).render("account/update", {
            title: "Edit Account",
            nav,
            errors: errors.array(),
            account_firstname,
            account_lastname,
            account_email,
            account_id, // Pass account_id back to view
        });
        return;
    }
    next();
};

/* **********************************
 * Change Password Data Validation Rules (Task 5)
 * ********************************* */
validate.changePasswordRules = () => {
    return [
        // Password is required and must meet requirements
        body("account_password")
            .trim()
            .isLength({ min: 10 })
            .withMessage("New password must be at least 10 characters.")
            .matches(
                /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{10,}$/
            )
            .withMessage(
                "New password must contain at least 1 uppercase, 1 number, and 1 special character."
            ),
    ];
};

/* ***********************************
 * Check Password Change Data (Task 5)
 * ********************************* */
validate.checkPasswordData = async (req, res, next) => {
    const { account_id } = req.body; // Assuming account_id is passed for password update
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        req.flash("notice", "Please fix the errors below to change your password.");
        res.status(400).render("account/update", { // Render the update page again for password errors
            title: "Edit Account",
            nav,
            errors: errors.array(),
            account_id,
            // You might want to re-fetch other account data here if needed,
            // or pass it from res.locals if it's already available from checkLogin
            account_firstname: res.locals.accountData.account_firstname,
            account_lastname: res.locals.accountData.account_lastname,
            account_email: res.locals.accountData.account_email,
        });
        return;
    }
    next();
};


module.exports = validate;
