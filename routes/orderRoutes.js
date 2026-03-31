const express = require("express");
const router = express.Router();
const { createOrder, getMyOrders } = require("../controller/orderController");
const { protect } = require("../middleware/authMiddleware");

router.get("/my", protect, getMyOrders);
router.post("/", protect, createOrder);

module.exports = router;
