const express = require("express");
const router = express.Router();
const { createOrder } = require("../controller/orderController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);

module.exports = router;
