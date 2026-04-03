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
	getMe,
	updateMyProfile,
	changeMyPassword,
	getMySubscription,
	selectSubscriptionPlan,
	getMyWishlist,
	addToWishlist,
	removeFromWishlist,
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
router.get("/me", protect, getMe);
router.put("/me", protect, updateMyProfile);
router.post("/change-password", protect, changeMyPassword);
router.get("/subscription", protect, getMySubscription);
router.post("/subscription/select", protect, selectSubscriptionPlan);
router.get("/wishlist", protect, getMyWishlist);
router.post("/wishlist", protect, addToWishlist);
router.delete("/wishlist/:bookId", protect, removeFromWishlist);
router.get("/", protect, authorize("admin"), getUsers);

module.exports = router;
