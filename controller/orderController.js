const Order = require("../models/Order");
const Cart = require("../models/Cart");

exports.createOrder = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });

  const order = new Order({
    user: req.user,
    items: cart.items,
    totalPrice: 0,
  });

  await order.save();

  cart.items = [];
  await cart.save();

  res.json(order);
};