const Order = require("../models/Order");
const Cart = require("../models/Cart");

exports.createOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user }).populate("items.book");

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const shippingInfo = req.body?.shippingInfo || {};
    const paymentMethod = req.body?.paymentMethod || "card";

    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address) {
      return res.status(400).json({
        message: "Shipping name, email, and address are required",
      });
    }

    const totalPrice = cart.items.reduce((sum, item) => {
      const unitPrice = Number(item.book?.price || 0);
      const quantity = Number(item.quantity || 0);
      return sum + unitPrice * quantity;
    }, 0);

    const order = new Order({
      user: req.user,
      items: cart.items,
      totalPrice,
      shippingInfo: {
        name: shippingInfo.name,
        email: shippingInfo.email,
        phone: shippingInfo.phone || "",
        address: shippingInfo.address,
        city: shippingInfo.city || "",
        zip: shippingInfo.zip || "",
        country: shippingInfo.country || "",
      },
      paymentMethod,
    });

    await order.save();

    cart.items = [];
    await cart.save();

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};