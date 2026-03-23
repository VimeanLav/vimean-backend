const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: Array,
  totalPrice: Number,
  shippingInfo: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    zip: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ["card", "paypal", "bank"],
    default: "card",
  },
  status: {
    type: String,
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);