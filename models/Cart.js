const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  freeBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    default: null,
  },
  items: [
    {
      book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
      quantity: { type: Number, default: 1 },
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema);