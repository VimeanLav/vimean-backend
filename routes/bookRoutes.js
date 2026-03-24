const express = require("express");
const router = express.Router();
const { getBooks, createBook, updateBookPrice } = require("../controller/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getBooks);
router.post("/", createBook);
router.patch("/:id/price", protect, authorize("admin"), updateBookPrice);

module.exports = router;