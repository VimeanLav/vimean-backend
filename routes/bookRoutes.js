const express = require("express");
const router = express.Router();
const {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  updateBookPrice,
} = require("../controller/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getBooks);
router.post("/", protect, authorize("admin"), createBook);
router.put("/:id", protect, authorize("admin"), updateBook);
router.delete("/:id", protect, authorize("admin"), deleteBook);
router.patch("/:id/price", protect, authorize("admin"), updateBookPrice);

module.exports = router;