const Book = require("../models/Book");
const mongoose = require("mongoose");

const ALLOWED_FEATURE_TAGS = [
  "trending",
  "topSeller",
  "bestSeller",
  "recommended",
  "newArrival",
];

const normalizeFeatureTags = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const firstValid = value
    .map((item) => String(item || "").trim())
    .find((tag) => ALLOWED_FEATURE_TAGS.includes(tag));

  return firstValid ? [firstValid] : [];
};

exports.getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

exports.createBook = async (req, res) => {
  const payload = {
    ...req.body,
    featureTags: normalizeFeatureTags(req.body?.featureTags),
  };

  const book = new Book(payload);
  const saved = await book.save();
  res.json(saved);
};

exports.updateBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const {
    title,
    author,
    description,
    genre,
    image,
    price,
    featureTags,
  } = req.body || {};

  const update = {};
  if (typeof title === "string") update.title = title.trim();
  if (typeof author === "string") update.author = author.trim();
  if (typeof description === "string") update.description = description.trim();
  if (typeof genre === "string") update.genre = genre.trim();
  if (typeof image === "string") update.image = image.trim();
  if (featureTags !== undefined) update.featureTags = normalizeFeatureTags(featureTags);

  if (price !== undefined) {
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    update.price = parsedPrice;
  }

  const updated = await Book.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json(updated);
};

exports.deleteBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const deleted = await Book.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json({ message: "Book deleted successfully" });
};

exports.updateBookPrice = async (req, res) => {
  const { id } = req.params;
  const { price } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Valid price is required" });
  }

  const updated = await Book.findByIdAndUpdate(
    id,
    { price: parsedPrice },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json(updated);
};

exports.deleteBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const deleted = await Book.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json({ message: "Book deleted successfully" });
};