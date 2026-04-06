const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  price: Number,
  genre: String,
  image: String,
  description: String,
  featureTags: {
    type: [String],
    default: [],
    enum: ["trending", "topSeller", "bestSeller", "recommended", "newArrival"],
  },
});

module.exports = mongoose.model("Book", bookSchema);