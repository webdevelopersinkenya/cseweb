const jwt = require("jsonwebtoken")

function checkEmployeeOrAdmin(req, res, next) {
  const token = req.cookies.jwt
  if (!token) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, account) => {
    if (err || (account.account_type !== "Employee" && account.account_type !== "Admin")) {
      req.flash("notice", "Unauthorized access.")
      return res.redirect("/account/login")
    }
    next()
  })
}
