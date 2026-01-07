// routes/static.js
const express = require("express");
const router = express.Router();
const path = require("path");
const baseController = require("../controllers/baseController");

// -----------------------------
// Serve static files (CSS, JS, Images)
// -----------------------------
router.use("/css", express.static(path.join(__dirname, "../public/css")));
router.use("/js", express.static(path.join(__dirname, "../public/js")));
router.use("/images", express.static(path.join(__dirname, "../public/images")));

// Optional: serve other public files directly
router.use(express.static(path.join(__dirname, "../public")));

// -----------------------------
// Home page route
// -----------------------------
router.get("/", baseController.buildHome);

// -----------------------------
// Export router
// -----------------------------
module.exports = router;
