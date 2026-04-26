const express = require("express");
const router = express.Router();

const {
  getStats,
  getOrders,
  updateOrderStatus,
  getUsers,
  getReports,
  getBooksAdmin,
  getCategories,
  getQuantities,
} = require("../controller/adminController");

router.get("/stats", getStats);
router.get("/orders", getOrders);
router.put("/orders/:id", updateOrderStatus);
router.get("/users", getUsers);
router.get("/reports", getReports);
router.get("/books", getBooksAdmin);
router.get("/categories", getCategories);
router.get("/quantities", getQuantities);

module.exports = router;

