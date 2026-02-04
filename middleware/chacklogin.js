// utilities/index.js (or a separate middleware file)
function checkLogin(req, res, next) {
  if (req.session && req.session.accountData) {
    // User is logged in, allow access
    next();
  } else {
    // User is not logged in, redirect to login
    req.flash("notice", "Please log in to access this page.");
    return res.redirect("/account/login");
  }
}

function checkLogout(req, res, next) {
  if (req.session && req.session.accountData) {
    // Already logged in, redirect to dashboard
    return res.redirect("/account/");
  } else {
    next();
  }
}

module.exports = { checkLogin, checkLogout };
