/*******************************
 * Load environment variables first
 *******************************/
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not defined in the .env file");
}

/*******************************
 * Required modules
 *******************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const flash = require("connect-flash");

const app = express();
const pool = require("./database/");
const utilities = require("./utilities/");

// Routes
const staticRoutes = require("./routes/static");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");

/*******************************
 * Session configuration
 *******************************/
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
    },
  })
);

/*******************************
 * Middleware
 *******************************/
app.use(cookieParser());
app.use(flash()); // must come AFTER session

// Populate res.locals for all views
app.use(async (req, res, next) => {
  try {
    res.locals.nav = await utilities.getNav(); // dynamic navigation
    res.locals.currentPath = req.path;        // used by navigation.ejs
    res.locals.accountData = req.session?.accountData || null;
    res.locals.loggedin = !!res.locals.accountData;
    res.locals.notice = req.flash("notice");  // flash messages
    next();
  } catch (error) {
    next(error);
  }
});

// JWT check middleware (optional)
app.use(utilities.checkJWTToken);

// Built-in middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

/*******************************
 * View Engine and Layouts
 *******************************/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "./layouts/layout");

/*******************************
 * Routes
 *******************************/
app.use("/", staticRoutes);
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute);

/*******************************
 * Error Handling
 *******************************/
// 404 handler
app.use(async (req, res, next) => {
  const nav = await utilities.getNav();
  res.status(404).render("errors/error", {
    title: "404 Not Found",
    message: "Sorry, we can't find that page.",
    nav,
    loggedin: req.session?.accountData ? true : false,
    accountData: req.session?.accountData || null,
  });
});

// General error handler
app.use(async (err, req, res, next) => {
  const nav = await utilities.getNav();
  console.error(`Error: ${err.message}`);
  res.status(500).render("errors/error", {
    title: "Server Error",
    message: err.message,
    nav,
    loggedin: req.session?.accountData ? true : false,
    accountData: req.session?.accountData || null,
  });
});

/*******************************
 * Start Server
 *******************************/
const port = process.env.PORT || 5500;
app.listen(port, () => {
  console.log(`App is listening on http://localhost:${port}`);
});
