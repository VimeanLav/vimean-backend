const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const accessTokenTtl = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshTokenTtlDays = Number(process.env.JWT_REFRESH_DAYS || 7);
const otpTtlMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 10);
const resetTtlMinutes = Number(process.env.RESET_EXPIRES_MINUTES || 15);
const adminEmails = new Set([
	"lav.vimean25@kit.edu.kh",
	"cheang.srengkoang24@kit.edu.kh",
	"sot.chulsa25@kit.edu.kh",
]);

const hashToken = (value) =>
	crypto.createHash("sha256").update(value).digest("hex");

const generateAccessToken = (user) => {
	return jwt.sign(
		{ id: user._id, role: user.role, tokenType: "access" },
		process.env.JWT_SECRET,
		{ expiresIn: accessTokenTtl }
	);
};

const generateRefreshTokenValue = () => crypto.randomBytes(48).toString("hex");

const issueAuthTokens = async (user) => {
	const refreshToken = generateRefreshTokenValue();
	user.refreshTokenHash = hashToken(refreshToken);
	user.refreshTokenExpiresAt = new Date(
		Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000
	);
	await user.save();

	return {
		accessToken: generateAccessToken(user),
		refreshToken,
	};
};

const sendMail = async ({ to, subject, text }) => {
	const nodemailer = require("nodemailer");
	const host = process.env.SMTP_HOST;
	const port = Number(process.env.SMTP_PORT || 587);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const from = process.env.SMTP_FROM || "no-reply@ecommerce.local";

	if (!host || !user || !pass) {
		console.log("[MAIL Fallback]", { to, subject, text });
		return;
	}

	const transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass },
	});

	await transporter.sendMail({ from, to, subject, text });
};

const buildAuthPayload = (user, tokens) => ({
	_id: user._id,
	name: user.name,
	email: user.email,
	role: user.role,
	accessToken: tokens.accessToken,
	refreshToken: tokens.refreshToken,
});

exports.registerUser = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res
				.status(400)
				.json({ message: "name, email and password are required" });
		}

		const normalizedEmail = email.toLowerCase();
		const existing = await User.findOne({ email: normalizedEmail });

		if (existing && existing.isVerified) {
			return res.status(400).json({ message: "User already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const otpCode = String(Math.floor(100000 + Math.random() * 900000));
		const otpCodeHash = hashToken(otpCode);
		const otpExpiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);

		let user;
		if (existing) {
			existing.name = name;
			existing.password = hashedPassword;
			existing.role = adminEmails.has(normalizedEmail) ? "admin" : "user";
			existing.otpCodeHash = otpCodeHash;
			existing.otpExpiresAt = otpExpiresAt;
			existing.isVerified = false;
			user = await existing.save();
		} else {
			user = await User.create({
				name,
				email: normalizedEmail,
				password: hashedPassword,
				role: adminEmails.has(normalizedEmail) ? "admin" : "user",
				isVerified: false,
				otpCodeHash,
				otpExpiresAt,
			});
		}

		await sendMail({
			to: user.email,
			subject: "Your verification OTP",
			text: `Your OTP is ${otpCode}. It expires in ${otpTtlMinutes} minutes.`,
		});

		return res.status(201).json({
			message: "Registration successful. OTP sent to email.",
			email: user.email,
		});
	} catch (error) {
		return next(error);
	}
};

exports.verifyOtp = async (req, res, next) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ message: "email and otp are required" });
		}

		const normalizedEmail = email.toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.isVerified) {
			return res.status(400).json({ message: "User already verified" });
		}

		if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
			return res.status(400).json({ message: "OTP expired. Register again for a new OTP" });
		}

		if (hashToken(String(otp)) !== user.otpCodeHash) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		user.isVerified = true;
		user.role = adminEmails.has(normalizedEmail) ? "admin" : user.role;
		user.otpCodeHash = null;
		user.otpExpiresAt = null;

		const tokens = await issueAuthTokens(user);
		return res.json(buildAuthPayload(user, tokens));
	} catch (error) {
		return next(error);
	}
};

exports.loginUser = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: "email and password are required" });
		}

		const normalizedEmail = email.toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		if (!user.isVerified) {
			return res.status(403).json({ message: "Please verify OTP before login" });
		}

		if (adminEmails.has(normalizedEmail) && user.role !== "admin") {
			user.role = "admin";
		}

		const tokens = await issueAuthTokens(user);
		return res.json(buildAuthPayload(user, tokens));
	} catch (error) {
		return next(error);
	}
};

exports.refreshToken = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({ message: "refreshToken is required" });
		}

		const refreshTokenHash = hashToken(refreshToken);
		const user = await User.findOne({
			refreshTokenHash,
			refreshTokenExpiresAt: { $gt: new Date() },
		});

		if (!user) {
			return res.status(401).json({ message: "Invalid or expired refresh token" });
		}

		const tokens = await issueAuthTokens(user);
		return res.json(tokens);
	} catch (error) {
		return next(error);
	}
};

exports.forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ message: "email is required" });
		}

		const normalizedEmail = email.toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		if (user) {
			const resetToken = crypto.randomBytes(32).toString("hex");
			user.resetPasswordTokenHash = hashToken(resetToken);
			user.resetPasswordExpiresAt = new Date(
				Date.now() + resetTtlMinutes * 60 * 1000
			);
			await user.save();

			await sendMail({
				to: user.email,
				subject: "Password reset token",
				text: `Your password reset token is ${resetToken}. It expires in ${resetTtlMinutes} minutes.`,
			});
		}

		return res.json({
			message: "If the email exists, a password reset token has been sent",
		});
	} catch (error) {
		return next(error);
	}
};

exports.resetPassword = async (req, res, next) => {
	try {
		const { token, newPassword } = req.body;

		if (!token || !newPassword) {
			return res.status(400).json({ message: "token and newPassword are required" });
		}

		const resetPasswordTokenHash = hashToken(token);
		const user = await User.findOne({
			resetPasswordTokenHash,
			resetPasswordExpiresAt: { $gt: new Date() },
		});

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired reset token" });
		}

		user.password = await bcrypt.hash(newPassword, 10);
		user.resetPasswordTokenHash = null;
		user.resetPasswordExpiresAt = null;
		user.refreshTokenHash = null;
		user.refreshTokenExpiresAt = null;
		await user.save();

		return res.json({ message: "Password reset successful" });
	} catch (error) {
		return next(error);
	}
};

exports.logoutUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.user);
		if (user) {
			user.refreshTokenHash = null;
			user.refreshTokenExpiresAt = null;
			await user.save();
		}

		return res.json({ message: "Logged out successfully" });
	} catch (error) {
		return next(error);
	}
};

exports.getUsers = async (req, res, next) => {
	try {
		const users = await User.find().select("-password -otpCodeHash -resetPasswordTokenHash -refreshTokenHash");
		return res.json(users);
	} catch (error) {
		return next(error);
	}
};
