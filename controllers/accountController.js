// accountController.js

const accountModel = require("../models/account-model");
const utilities = require("../utilities/");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { validationResult } = require("express-validator");

/* ****************************************
 * Deliver login view
 * ************************************ */
async function buildLogin(req, res) {
  const nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: "",
    notice: req.flash("notice")  // add this if not using global res.locals
  });
}


/* ****************************************
 * Deliver registration view
 * ************************************ */
async function buildRegister(req, res) {
  const nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    account_firstname: "",
    account_lastname: "",
    account_email: "",
  });
}

/* ****************************************
 * Process Registration
 * ************************************ */
async function registerAccount(req, res) {
  const nav = await utilities.getNav();
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  } = req.body;

  try {
    // Check if email already exists
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      req.flash(
        "notice",
        "Email already exists. Please login or use a different email."
      );
      return res.status(409).render("account/register", {
        title: "Register",
        nav,
        errors: [],
        account_firstname,
        account_lastname,
        account_email,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(account_password, 10);

    // Insert account
    await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    //  Flash success message
    req.flash(
      "notice",
      ` Congratulations ${account_firstname}, you are now registered. Please log in.`
    );

    // Redirect (not render)
    return res.redirect("/account/login");

  } catch (error) {
    console.error("Registration error:", error.message);
    req.flash(
      "notice",
      "Sorry, there was an error processing the registration."
    );
    return res.status(500).render("account/register", {
      title: "Register",
      nav,
      errors: [],
      account_firstname,
      account_lastname,
      account_email,
    });
  }
}


/* ****************************************
 * Process login request
 * ************************************ */
async function accountLogin(req, res) {
  const nav = await utilities.getNav();
  const { account_email, account_password } = req.body;
  const accountData = await accountModel.getAccountByEmail(account_email);

  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.");
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    });
  }

  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password;

      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 3600000,
      });

      return res.redirect("/account/");
    } else {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      });
    }
  } catch (error) {
    console.error("Account Login Error:", error);
    req.flash("notice", "Login failed due to a server error.");
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    });
  }
}

/* ****************************************
 * Deliver Account Management View
 * ************************************ */
async function buildAccountManagement(req, res) {
  const nav = await utilities.getNav();
  res.render("account/account", {
    title: "Account Management",
    nav,
    errors: null,
  });
}

/* ****************************************
 * Deliver Account Update View
 * ************************************ */
async function buildAccountUpdate(req, res) {
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;
  res.render("account/account-update", {
    title: "Edit Account",
    nav,
    errors: null,
    account_firstname: accountData.account_firstname,
    account_lastname: accountData.account_lastname,
    account_email: accountData.account_email,
    account_id: accountData.account_id,
  });
}

/* ****************************************
 * Process Account Profile Update
 * ************************************ */
async function updateAccount(req, res) {
  const nav = await utilities.getNav();
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_id,
  } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("account/account-update", {
      title: "Edit Account",
      nav,
      errors: errors.array(),
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }

  try {
    const updateResult = await accountModel.updateAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_id
    );

    if (updateResult) {
      req.flash("notice", "Account information successfully updated.");

      const updatedAccountData = await accountModel.getAccountById(account_id);
      delete updatedAccountData.account_password;

      const accessToken = jwt.sign(updatedAccountData, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 3600000,
      });

      return res.redirect("/account/");
    } else {
      req.flash("notice", "Account update failed.");
      res.status(500).render("account/account-update", {
        title: "Edit Account",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
        account_id,
      });
    }
  } catch (error) {
    req.flash("notice", "An unexpected error occurred: " + error.message);
    res.status(500).render("account/account-update", {
      title: "Edit Account",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }
}

/* ****************************************
 * Process Password Update
 * ************************************ */
async function updatePassword(req, res) {
  const nav = await utilities.getNav();
  const { account_password, account_id } = req.body;

  const errors = validationResult(req);
  const accountData = res.locals.accountData;

  if (!errors.isEmpty()) {
    req.flash("notice", "Please fix the errors below.");
    return res.status(400).render("account/account-update", {
      title: "Edit Account",
      nav,
      errors: errors.array(),
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_id: accountData.account_id,
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10);
    const updateResult = await accountModel.updatePassword(
      hashedPassword,
      account_id
    );

    if (updateResult) {
      req.flash("notice", "Password successfully updated.");
      res.redirect("/account/");
    } else {
      req.flash("notice", "Password update failed.");
      res.status(500).render("account/account-update", {
        title: "Edit Account",
        nav,
        errors: null,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
        account_id: accountData.account_id,
      });
    }
  } catch (error) {
    req.flash("notice", "An unexpected error occurred: " + error.message);
    res.status(500).render("account/account-update", {
      title: "Edit Account",
      nav,
      errors: null,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_id: accountData.account_id,
    });
  }
}

/* ****************************************
 * Process Logout
 * ************************************ */
async function accountLogout(req, res) {
  res.clearCookie("jwt");
  req.flash("notice", "You have been logged out.");
  res.redirect("/");
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildAccountUpdate,
  updateAccount,
  updatePassword,
  accountLogout,
};
