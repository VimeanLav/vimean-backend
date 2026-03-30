const express = require("express");
const router = express.Router();

const { getStats } = require("../controller/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/stats", protect, authorize("admin"), getStats);

module.exports = router;    