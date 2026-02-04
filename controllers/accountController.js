// controllers/accountController.js

const accountModel = require("../models/account-model");
const utilities = require("../utilities/");
const bcrypt = require("bcryptjs");

/* ****************************************
 * Deliver login view
 **************************************** */
async function buildLogin(req, res) {
  res.render("account/login", {
    title: "Login",
    nav: await utilities.getNav(),
    errors: null,
    account_email: "",
    notice: req.flash("notice"),
  });
}

/* ****************************************
 * Deliver registration view
 **************************************** */
async function buildRegister(req, res) {
  res.render("account/register", {
    title: "Register",
    nav: await utilities.getNav(),
    errors: null,
    account_firstname: "",
    account_lastname: "",
    account_email: "",
    notice: req.flash("notice"),
  });
}

/* ****************************************
 * Process Registration
 **************************************** */
async function registerAccount(req, res) {
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      req.flash("notice", "Email already exists. Please login or use a different email.");
      return res.redirect("/account/register");
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);

    await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    req.flash("notice", `Congratulations ${account_firstname}, you are now registered. Please log in.`);
    return res.redirect("/account/login");

  } catch (error) {
    console.error("Registration error:", error);
    req.flash("notice", "Sorry, there was an error processing your registration.");
    return res.redirect("/account/register");
  }
}

/* ****************************************
 * Process Login
 **************************************** */
async function accountLogin(req, res) {
  const { account_email, account_password } = req.body;
  const accountData = await accountModel.getAccountByEmail(account_email);

  if (!accountData) {
    req.flash("notice", "Invalid email or password.");
    return res.redirect("/account/login");
  }

  try {
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (!passwordMatch) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }

    // Remove password before storing in session
    delete accountData.account_password;
    req.session.accountData = accountData;

    req.flash("notice", `Welcome back, ${accountData.account_firstname}!`);
    return res.redirect("/account/");

  } catch (error) {
    console.error("Login error:", error);
    req.flash("notice", "Login failed due to server error.");
    return res.redirect("/account/login");
  }
}

/* ****************************************
 * Deliver Account Management View
 **************************************** */
async function buildAccountManagement(req, res) {
  const accountData = req.session.accountData;
  res.render("account/account", {
    title: "Account Dashboard",
    nav: await utilities.getNav(),
    errors: null,
    account: accountData,
    notice: req.flash("notice"),
  });
}
/* ****************************************
 * Process Logout
 * Deletes session & token cookie, redirects to home
 **************************************** */
async function accountLogout(req, res) {
  // Flash message (optional, can show on home page)
  req.flash("notice", "You have been logged out.");

  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.redirect("/"); // fallback to home if error
    }

    // Clear token cookie
    res.clearCookie("jwt");

    // Redirect to home
    return res.redirect("/");
  });
}

module.exports = {
  // ...existing exports
  accountLogout,
};


/* ****************************************
 * Deliver account update view (GET)
 **************************************** */
// Deliver the account update view
async function buildUpdateAccount(req, res, next) {
  try {
    const account_id = parseInt(req.params.account_id);
    const accountData = await accountModel.getAccountById(account_id);

    // If account not found, create empty object
    const account = accountData || {};

    res.render("account/update-account", {
      title: "Update Account",
      errors: null,
      account,                // <-- THIS is key
      notice: req.flash("notice")
    });
  } catch (err) {
    next(err);
  }
}
/* ****************************************
 * Process Account Info Update (POST)
 **************************************** */
async function updateAccount(req, res, next) {
  try {
    const { account_id, account_firstname, account_lastname, account_email } = req.body;

    // Update account in DB
    const result = await accountModel.updateAccount({
      account_id,
      account_firstname,
      account_lastname,
      account_email
    });

    // Get the updated account data
    const updatedAccount = await accountModel.getAccountById(account_id);

    // Update session info
    req.session.accountData = updatedAccount;

    // Send success message
    req.flash("success", "Account updated successfully.");

    // Render view with updated data
    res.render("account/update-account", {
      title: "Update Account",
      account: updatedAccount,
      errors: null,
      notice: req.flash("success")
    });

  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Password Update (POST)
 **************************************** */
async function updatePassword(req, res, next) {
  try {
    const { account_id, account_password } = req.body;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(account_password, 10);

    // Update password in database
    const result = await accountModel.updatePassword(account_id, hashedPassword);

    // Fetch the updated account info
    const updatedAccount = await accountModel.getAccountById(account_id);

    // Update session
    req.session.accountData = updatedAccount;

    // Send success message
    req.flash("success", "Password updated successfully.");

    // Render account update page
    res.render("account/update-account", {
      title: "Update Account",
      account: updatedAccount,
      errors: null,
      notice: req.flash("success")
    });

  } catch (err) {
    next(err);
  }
}
module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  accountLogout,
  buildUpdateAccount,
  updateAccount,
  updatePassword
};
