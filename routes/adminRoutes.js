const express = require("express");
const router = express.Router();

const { getStats } = require("../controller/adminController");

// THIS is the important line 👇
router.get("/stats", getStats);

module.exports = router;