const Cart = require("../models/Cart");
const Book = require("../models/Book");
const mongoose = require("mongoose");

const PREMIUM_FREE_BOOK_MIN_SUBTOTAL = 50;

const isPremiumUser = (userDoc) =>
  userDoc?.subscriptionPlan === "premium" &&
  (userDoc?.subscriptionStatus || "active") === "active";

const calculateSubtotal = (cart) => {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  return items.reduce((sum, item) => {
    const unitPrice = Number(item?.book?.price || 0);
    const quantity = Number(item?.quantity || 0);
    return sum + unitPrice * quantity;
  }, 0);
};

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

  if (cart.freeBookId) {
    const selectedStillExists = cart.items.some(
      (item) => item.book.toString() === String(cart.freeBookId)
    );
    if (!selectedStillExists) {
      cart.freeBookId = null;
    }
  }

  await cart.save();
  res.json(cart);
};

exports.removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });

  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  cart.items = cart.items.filter(
    (item) => item.book.toString() !== req.params.bookId
  );

  if (String(cart.freeBookId || "") === String(req.params.bookId || "")) {
    cart.freeBookId = null;
  }

  await cart.save();
  res.json(cart);
};

exports.selectFreeBook = async (req, res) => {
  const { bookId } = req.body || {};

  if (!bookId) {
    return res.status(400).json({ message: "bookId is required" });
  }

  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid bookId" });
  }

  if (!isPremiumUser(req.userDoc)) {
    return res.status(403).json({ message: "Premium subscription is required" });
  }

  const cart = await Cart.findOne({ user: req.user }).populate("items.book");

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const hasBook = cart.items.some(
    (item) => item?.book?._id?.toString() === String(bookId)
  );

  if (!hasBook) {
    return res.status(400).json({ message: "Selected free book must be in cart" });
  }

  const subtotal = calculateSubtotal(cart);
  if (subtotal < PREMIUM_FREE_BOOK_MIN_SUBTOTAL) {
    return res.status(400).json({
      message: `Cart subtotal must be at least $${PREMIUM_FREE_BOOK_MIN_SUBTOTAL.toFixed(2)} to select a free book`,
    });
  }

  cart.freeBookId = bookId;
  await cart.save();

  const updated = await Cart.findById(cart._id).populate("items.book");
  return res.json(updated);
};

exports.clearFreeBook = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });

  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  cart.freeBookId = null;
  await cart.save();

  const updated = await Cart.findById(cart._id).populate("items.book");
  return res.json(updated);
};