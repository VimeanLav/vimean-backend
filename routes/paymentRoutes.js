const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createAbaPurchase } = require("../controller/paymentController");

router.post("/aba/purchase", protect, createAbaPurchase);

module.exports = router;
