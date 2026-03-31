const Book = require("../models/Book");
const Order = require("../models/Order");
const User = require("../models/User");

const getStats = async (_req, res, next) => {
  try {
    const [totalOrders, newOrders, deliveredOrders, cancelledOrders, totalBooks, totalUsers] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Book.countDocuments(),
      User.countDocuments(),
    ]);

    res.json({
      totalOrders,
      newOrders,
      deliveredOrders,
      cancelledOrders,
      totalBooks,
      totalUsers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };