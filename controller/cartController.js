const Cart = require("../models/Cart");
const Book = require("../models/Book");
const mongoose = require("mongoose");

exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user }).populate("items.book");
  res.json(cart);
};

exports.addToCart = async (req, res) => {
  const { bookId } = req.body || {};

  if (!bookId) {
    return res.status(400).json({ message: "bookId is required" });
  }

  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid bookId" });
  }

  const bookExists = await Book.exists({ _id: bookId });
  if (!bookExists) {
    return res.status(404).json({ message: "Book not found" });
  }

  let cart = await Cart.findOne({ user: req.user });

  if (!cart) {
    cart = new Cart({ user: req.user, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.book.toString() === bookId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += 1;
  } else {
    cart.items.push({ book: bookId });
  }

  await cart.save();
  res.json(cart);
};

exports.removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });

  cart.items = cart.items.filter(
    (item) => item.book.toString() !== req.params.bookId
  );

  await cart.save();
  res.json(cart);
};