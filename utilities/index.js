const pool = require("../database/");
const inventoryModel = require("../models/inventory-model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/* ****************************************
 * Build Navigation HTML
 ****************************************/
async function getNav() {
  let navList = "<ul><li><a href='/'>Home</a></li>";

  try {
    const classifications = await inventoryModel.getClassifications();
    const seen = new Set();

    classifications.forEach(({ classification_name }) => {
      if (!seen.has(classification_name)) {
        navList += `<li><a href="/inv/type/${classification_name}">${classification_name}</a></li>`;
        seen.add(classification_name);
      }
    });
  } catch (error) {
    console.error("Error building navigation:", error.message);
    // Fallback navigation
    ["Custom", "Sedan", "SUV", "Truck"].forEach((name) => {
      navList += `<li><a href="/inv/type/${name}">${name}</a></li>`;
    });
  }

  navList += "</ul>";
  return navList;
}

/* ****************************************
 * Build Classification Select List
 ****************************************/
async function buildClassificationList(selectedId = null) {
  try {
    const classifications = await inventoryModel.getClassifications();
    const uniqueClasses = new Map();

    classifications.forEach(({ classification_name, classification_id }) => {
      if (!uniqueClasses.has(classification_name)) {
        uniqueClasses.set(classification_name, classification_id);
      }
    });

    let options = `<select name="classification_id" id="classificationList" required size="4">`;
    options += `<option value="">Choose a Classification</option>`;

    uniqueClasses.forEach((id, name) => {
      const selected = selectedId !== null && id == selectedId ? "selected" : "";
      options += `<option value="${id}" ${selected}>${name}</option>`;
    });

    options += "</select>";
    return options;
  } catch (error) {
    console.error("Error building classification list:", error.message);
    throw new Error("Failed to build classification list for form.");
  }
}

/* ****************************************
 * Build Vehicle Detail HTML
 ****************************************/
async function buildVehicleDetail(vehicle) {
  if (!vehicle) {
    return '<p class="error-message">Vehicle data is unavailable.</p>';
  }

  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(vehicle.inv_price);
  const mileage = new Intl.NumberFormat("en-US").format(vehicle.inv_miles);

  return `
    <div class="vehicle-detail-container">
      <div class="vehicle-detail-image">
        <img src="${vehicle.inv_image}" alt="${vehicle.inv_make} ${vehicle.inv_model}" 
             onerror="this.onerror=null;this.src='https://placehold.co/600x400/CCCCCC/000000?text=Image+Missing';">
      </div>
      <div class="vehicle-detail-info">
        <h1>${vehicle.inv_make} ${vehicle.inv_model}</h1>
        <p class="price"><strong>Price:</strong> ${price}</p>
        <hr>
        <p><strong>Year:</strong> ${vehicle.inv_year}</p>
        <p><strong>Mileage:</strong> ${mileage} miles</p>
        <p><strong>Color:</strong> ${vehicle.inv_color}</p>
        <p><strong>Description:</strong> ${vehicle.inv_description}</p>
      </div>
    </div>
  `;
}

/* ****************************************
 * Build Inventory Grid HTML
 ****************************************/
async function buildClassificationGrid(items) {
  if (!items || items.length === 0) {
    return '<p class="notice">Sorry, no vehicles matching this classification could be found.</p>';
  }

  let grid = '<div class="inv-classification-grid">';
  items.forEach((vehicle) => {
    const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(vehicle.inv_price);
    grid += `
      <div class="inv-card">
        <a href="/inv/detail/${vehicle.inv_id}" title="View details for ${vehicle.inv_make} ${vehicle.inv_model}">
          <img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}" 
               onerror="this.onerror=null;this.src='https://placehold.co/280x200/CCCCCC/000000?text=Thumbnail+Missing';">
        </a>
        <div class="inv-card-content">
          <h2>
            <a href="/inv/detail/${vehicle.inv_id}" title="View details for ${vehicle.inv_make} ${vehicle.inv_model}">
              ${vehicle.inv_make} ${vehicle.inv_model}
            </a>
          </h2>
          <span>${price}</span>
        </div>
      </div>
    `;
  });
  grid += "</div>";
  return grid;
}

/* ****************************************
 * JWT Authentication Middleware
 ****************************************/
function checkJWTToken(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return next();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
    if (err) {
      req.flash("notice", "Please log in");
      res.clearCookie("jwt");
      return res.redirect("/account/login");
    }
    res.locals.accountData = accountData;
    res.locals.loggedin = true;
    next();
  });
}

/* ****************************************
 * Ensure User is Logged In
 ****************************************/
function checkLogin(req, res, next) {
  if (res.locals.loggedin) return next();
  req.flash("notice", "Please log in.");
  return res.redirect("/account/login");
}

/* ****************************************
 * Ensure User is Logged Out
 ****************************************/
function checkLogout(req, res, next) {
  if (res.locals.loggedin) return res.redirect("/account/");
  next();
}

/* ****************************************
 * Check Account Type (Admin or Employee)
 ****************************************/
function checkAccountType(req, res, next) {
  if (
    res.locals.loggedin &&
    ["Admin", "Employee"].includes(res.locals.accountData.account_type)
  ) {
    return next();
  }
  req.flash("notice", "You are not authorized to access this page.");
  return res.redirect(res.locals.loggedin ? "/account/" : "/account/login");
}

/* ****************************************
 * Async Error Handler Wrapper
 ****************************************/
function handleErrors(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  getNav,
  buildClassificationList,
  buildVehicleDetail,
  buildClassificationGrid,
  checkJWTToken,
  checkLogin,
  checkLogout,
  checkAccountType,
  handleErrors,
};
