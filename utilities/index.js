const pool = require('../database/');
const inventoryModel = require('../models/inventory-model');
const jwt = require("jsonwebtoken");
require("dotenv").config();

/* ***********************
 * General Utilities
 *************************/

/**
 * Builds the navigation HTML string from database data or hardcoded values.
 * @returns {string} The HTML string for the navigation.
 */
async function getNav() {
  let navList = '<ul>';
  try {
    const classifications = await inventoryModel.getClassifications();

    navList += '<li><a href="/">Home</a></li>';

    // Use a Set to prevent duplicate classification names
    const seen = new Set();
    classifications.forEach((item) => {
      if (!seen.has(item.classification_name)) {
        const linkPath = `/inv/type/${item.classification_name}`;
        navList += `<li><a href="${linkPath}">${item.classification_name}</a></li>`;
        seen.add(item.classification_name);
      }
    });

  } catch (error) {
    console.error("Error building navigation:", error.message, error.stack);
    // Fallback hardcoded nav
    navList += '<li><a href="/">Home</a></li>';
    navList += '<li><a href="/inv/type/Custom">Custom</a></li>';
    navList += '<li><a href="/inv/type/Sedan">Sedan</a></li>';
    navList += '<li><a href="/inv/type/SUV">SUV</a></li>';
    navList += '<li><a href="/inv/type/Truck">Truck</a></li>';
    console.warn("Using hardcoded navigation due to database error or missing classification data.");
  }

  navList += '</ul>';
  return navList;
}

/**
 * Builds a classification select list for forms.
 * @param {number} [selectedId] - Pre-select this classification if provided.
 * @returns {string} The HTML string for the select list.
 */
async function buildClassificationList(selectedId = null) {
  try {
    const classifications = await inventoryModel.getClassifications();

    // Filter duplicates using a Map (classification_name => classification_id)
    const uniqueClasses = new Map();
    classifications.forEach(row => {
      if (!uniqueClasses.has(row.classification_name)) {
        uniqueClasses.set(row.classification_name, row.classification_id);
      }
    });

    let options = '<select name="classification_id" id="classificationList" required size="4">';
    options += '<option value="">Choose a Classification</option>';

    uniqueClasses.forEach((id, name) => {
      const selected = (selectedId !== null && id == selectedId) ? 'selected' : '';
      options += `<option value="${id}" ${selected}>${name}</option>`;
    });

    options += '</select>';
    return options;
  } catch (error) {
    console.error("Error building classification list:", error.message, error.stack);
    throw new Error("Failed to build classification list for form.");
  }
}

/**
 * Builds HTML for a single vehicle detail view.
 * @param {object} vehicleData
 * @returns {string} HTML string
 */
async function buildVehicleDetail(vehicleData) {
  if (!vehicleData) {
    return '<p class="error-message">Vehicle data is unavailable.</p>';
  }

  const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(vehicleData.inv_price);
  const formattedMileage = new Intl.NumberFormat('en-US').format(vehicleData.inv_miles);

  return `
    <div class="vehicle-detail-container">
      <div class="vehicle-detail-image">
        <img src="${vehicleData.inv_image}" alt="${vehicleData.inv_make} ${vehicleData.inv_model} - Full Image" 
             onerror="this.onerror=null;this.src='https://placehold.co/600x400/CCCCCC/000000?text=Image+Missing';">
      </div>
      <div class="vehicle-detail-info">
        <h1>${vehicleData.inv_make} ${vehicleData.inv_model}</h1>
        <p class="price"><strong>Price:</strong> ${formattedPrice}</p>
        <hr>
        <p><strong>Year:</strong> ${vehicleData.inv_year}</p>
        <p><strong>Mileage:</strong> ${formattedMileage} miles</p>
        <p><strong>Color:</strong> ${vehicleData.inv_color}</p>
        <p><strong>Description:</strong> ${vehicleData.inv_description}</p>
      </div>
    </div>
  `;
}

/**
 * Builds a grid of inventory items for a classification.
 * @param {Array<object>} data
 * @returns {string} HTML string
 */
async function buildClassificationGrid(data) {
  if (!data || data.length === 0) {
    return '<p class="notice">Sorry, no vehicles matching this classification could be found.</p>';
  }

  let grid = '<div class="inv-classification-grid">';
  data.forEach(vehicle => {
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
          <span>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(vehicle.inv_price)}</span>
        </div>
      </div>
    `;
  });
  grid += '</div>';
  return grid;
}

/* ****************************************
 * JWT Authentication Middleware
 **************************************** */
function checkJWTToken(req, res, next) {
  if (req.cookies.jwt) {
    jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
      if (err) {
        req.flash("notice", "Please log in");
        res.clearCookie("jwt");
        return res.redirect("/account/login");
      }
      res.locals.accountData = accountData; // make available to views
      res.locals.loggedin = 1;
      next();
    });
  } else {
    next();
  }
}

/* ****************************************
 * Ensure User is Logged In
 **************************************** */
function checkLogin(req, res, next) {
  if (res.locals.loggedin) {
    next();
  } else {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
}

/* ****************************************
 * Check Account Type (Admin/Employee)
 **************************************** */
function checkAccountType(req, res, next) {
  if (res.locals.loggedin && (res.locals.accountData.account_type === 'Admin' || res.locals.accountData.account_type === 'Employee')) {
    next();
  } else {
    req.flash("notice", "You are not authorized to access this page.");
    return res.redirect(res.locals.loggedin ? "/account/" : "/account/login");
  }
}

/**
 * Higher-order function to wrap async route handlers
 */
function handleErrors(fn) {
  return function (req, res, next) {
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
  checkAccountType,
  handleErrors,
};
