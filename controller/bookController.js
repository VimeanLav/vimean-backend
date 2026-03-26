const Book = require("../models/Book");
const mongoose = require("mongoose");

exports.getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

exports.createBook = async (req, res) => {
  const book = new Book(req.body);
  const saved = await book.save();
  res.json(saved);
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