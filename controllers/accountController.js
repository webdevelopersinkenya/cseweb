const accountModel = require("../models/account-model");
const utilities = require("../utilities/");
const bcrypt = require("bcryptjs");

/* ****************************************
 * Deliver Login View
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
 * Deliver Registration View
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
    await accountModel.registerAccount(account_firstname, account_lastname, account_email, hashedPassword);

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

  try {
    const accountData = await accountModel.getAccountByEmail(account_email);

    if (!accountData) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }

    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (!passwordMatch) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }

    delete accountData.account_password; // remove password before storing
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
 * Deliver Account Update Form (GET)
 **************************************** */
async function buildUpdateAccount(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const accountData = await accountModel.getAccountById(account_id);
    const account = accountData || {};

    res.render("account/update-account", {
      title: "Update Account",
      errors: null,
      account,
      notice: req.flash("notice"),
    });
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Account Profile Update (POST)
 **************************************** */
async function updateAccount(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const { account_firstname, account_lastname, account_email } = req.body;

    if (!account_firstname || !account_lastname || !account_email) {
      req.flash("notice", "All fields are required.");
      return res.redirect("/account/update");
    }

    await accountModel.updateAccount({ account_id, account_firstname, account_lastname, account_email });

    req.session.accountData = await accountModel.getAccountById(account_id);
    req.flash("notice", "Account updated successfully.");
    return res.redirect("/account/update");
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Password Update (POST)
 **************************************** */
async function updatePassword(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const { account_password, account_password_confirm } = req.body;

    if (!account_password || !account_password_confirm) {
      req.flash("notice", "Both password fields are required.");
      return res.redirect("/account/update");
    }

    if (account_password !== account_password_confirm) {
      req.flash("notice", "Passwords do not match.");
      return res.redirect("/account/update");
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);
    await accountModel.updatePassword(account_id, hashedPassword);

    req.session.accountData = await accountModel.getAccountById(account_id);
    req.flash("notice", "Password updated successfully.");
    return res.redirect("/account/update");
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Logout
 **************************************** */
async function accountLogout(req, res) {
  req.flash("notice", "You have been logged out.");
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.redirect("/");
    }
    res.clearCookie("jwt");
    return res.redirect("/");
  });
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildUpdateAccount,
  updateAccount,
  updatePassword,
  accountLogout,
};
