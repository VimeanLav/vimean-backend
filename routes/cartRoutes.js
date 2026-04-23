const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  selectFreeBook,
  clearFreeBook,
} = require("../controller/cartController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.post("/free-book", protect, selectFreeBook);
router.delete("/free-book", protect, clearFreeBook);
router.delete("/:bookId", protect, removeFromCart);

module.exports = router;