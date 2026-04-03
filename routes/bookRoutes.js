const express = require("express");
const router = express.Router();
const { getBooks, createBook, updateBookPrice, deleteBook } = require("../controller/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getBooks);
router.post("/", createBook);
router.patch("/:id/price", protect, authorize("admin"), updateBookPrice);
router.delete("/:id", protect, authorize("admin"), deleteBook);

module.exports = router;