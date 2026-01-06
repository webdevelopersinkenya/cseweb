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

    classifications.forEach((item) => {
      const linkPath = `/inv/type/${item.classification_name}`;
      navList += `<li><a href="${linkPath}">${item.classification_name}</a></li>`;
    });

  } catch (error) {
    console.error("Error building navigation:", error.message, error.stack);
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
 * Builds a classification select list (e.g., for vehicle types).
 * @param {number} [selectedId] - The ID of the classification to be pre-selected.
 * @returns {string} The HTML string for the select list.
 */
async function buildClassificationList(selectedId = null) {
  try {
    const classifications = await inventoryModel.getClassifications();
    let options = '<select name="classification_id" id="classificationList" required size="4">';
    options += '<option value="">Choose a Classification</option>';

    classifications.forEach((row) => {
      const selected = (selectedId !== null && row.classification_id == selectedId) ? 'selected' : '';
      options += `<option value="${row.classification_id}" ${selected}>${row.classification_name}</option>`;
    });

    options += '</select>';
    return options;
  } catch (error) {
    console.error("Error building classification list:", error.message, error.stack);
    throw new Error("Failed to build classification list for form.");
  }
}

/**
 * Builds the HTML for a single vehicle detail view.
 * @param {object} vehicleData - The object containing all vehicle details.
 * @returns {string} The HTML string for the vehicle detail view.
 */
async function buildVehicleDetail(vehicleData) {
    if (!vehicleData) {
        return '<p class="error-message">Vehicle data is unavailable.</p>';
    }

    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(vehicleData.inv_price);

    const formattedMileage = new Intl.NumberFormat('en-US').format(vehicleData.inv_miles);

    let detailHtml = `
        <div class="vehicle-detail-container">
            <div class="vehicle-detail-image">
                <img src="${vehicleData.inv_image}" alt="${vehicleData.inv_make} ${vehicleData.inv_model} - Full Image" onerror="this.onerror=null;this.src='https://placehold.co/600x400/CCCCCC/000000?text=Image+Missing';">
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
    return detailHtml;
}

/**
 * Builds the HTML grid of inventory items for a classification view.
 * @param {Array<object>} data - An array of inventory item objects.
 * @returns {string} The HTML string for the grid.
 */
async function buildClassificationGrid(data) {
  let grid = '';
  if (data.length > 0) {
    grid = '<div class="inv-classification-grid">';
    data.forEach(vehicle => {
      grid += `
        <div class="inv-card">
          <a href="/inv/detail/${vehicle.inv_id}" title="View details for ${vehicle.inv_make} ${vehicle.inv_model}">
            <img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}" onerror="this.onerror=null;this.src='https://placehold.co/280x200/CCCCCC/000000?text=Thumbnail+Missing';">
          </a>
          <div class="inv-card-content">
            <h2>
              <a href="/inv/detail/${vehicle.inv_id}" title="View details for ${vehicle.inv_make} ${vehicle.inv_model}">
                ${vehicle.inv_make} ${vehicle.inv_model}
              </a>
            </h2>
            <span>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(vehicle.inv_price)}</span>
          </div>
        </div>
      `;
    });
    grid += '</div>';
  } else {
    grid += '<p class="notice">Sorry, no vehicles matching this classification could be found.</p>';
  }
  return grid;
}

/* ****************************************
* Middleware to check token validity
**************************************** */
function checkJWTToken(req, res, next) {
 if (req.cookies.jwt) {
  jwt.verify(
   req.cookies.jwt,
   process.env.ACCESS_TOKEN_SECRET,
   function (err, accountData) {
    if (err) {
     req.flash("notice", "Please log in");
     res.clearCookie("jwt");
     return res.redirect("/account/login");
    }
    res.locals.accountData = accountData; // Make account data available to views and next middleware
    res.locals.loggedin = 1; // Set loggedin flag for views
    next();
   });
 } else {
  next();
 }
}

/* ****************************************
 * Check Login
 * Purpose: Middleware to ensure a user is logged in.
 * Must be used AFTER checkJWTToken.
 * ************************************ */
function checkLogin(req, res, next) {
  if (res.locals.loggedin) {
    next(); // User is logged in, proceed
  } else {
    req.flash("notice", "Please log in."); // Flash message
    return res.redirect("/account/login"); // Redirect to login page
  }
}

/* ****************************************
 * Check Account Type (Authorization Middleware) (Task 2)
 * Purpose: Middleware to check if a logged-in user has 'Admin' or 'Employee' account_type.
 * Must be used AFTER checkLogin.
 * ************************************ */
function checkAccountType(req, res, next) {
  // Check if user is logged in AND their account_type is 'Admin' or 'Employee'
  // Use res.locals.accountData which is set by checkJWTToken
  if (res.locals.loggedin && (res.locals.accountData.account_type === 'Admin' || res.locals.accountData.account_type === 'Employee')) {
    next(); // Authorized, proceed
  } else {
    req.flash("notice", "You are not authorized to access this page. Please log in with appropriate permissions.");
    // Redirect based on whether they are logged in or not
    if (res.locals.loggedin) {
      // If logged in but not authorized for this page, send them to general account page
      return res.redirect("/account/");
    } else {
      // Not logged in, send to login page
      return res.redirect("/account/login");
    }
  }
}


/**
 * Higher-order function to wrap async route handlers for centralized error handling.
 * @param {function} fn - The async function to wrap.
 * @returns {function} An Express middleware function.
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
  checkAccountType, // EXPORT NEW FUNCTION
  handleErrors,
};
