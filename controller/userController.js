const User = require("../models/User");

exports.registerUser = async (req, res) => {
	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		return res.status(400).json({ message: "name, email and password are required" });
	}

	const existing = await User.findOne({ email });
	if (existing) {
		return res.status(400).json({ message: "User already exists" });
	}

	const user = await User.create({ name, email, password });
	res.status(201).json({
		_id: user._id,
		name: user.name,
		email: user.email,
	});
};

exports.loginUser = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: "email and password are required" });
	}

	const user = await User.findOne({ email, password });
	if (!user) {
		return res.status(401).json({ message: "Invalid credentials" });
	}

	res.json({
		_id: user._id,
		name: user.name,
		email: user.email,
	});
};

exports.getUsers = async (req, res) => {
	const users = await User.find().select("-password");
	res.json(users);
};
