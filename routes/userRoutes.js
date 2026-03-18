const express = require("express");
const router = express.Router();
const {
	registerUser,
	verifyOtp,
	loginUser,
	refreshToken,
	forgotPassword,
	resetPassword,
	logoutUser,
	getUsers,
} = require("../controller/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", protect, logoutUser);
router.get("/", protect, authorize("admin"), getUsers);

module.exports = router;
