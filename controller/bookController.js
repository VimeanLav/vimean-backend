const Book = require("../models/Book");

exports.getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

exports.createBook = async (req, res) => {
  const book = new Book(req.body);
  const saved = await book.save();
  res.json(saved);
};