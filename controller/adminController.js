const Book = require("../models/Book");
const Order = require("../models/Order");
const User = require("../models/User");


// =====================
// Dashboard Stats
// =====================
const getStats = async (req, res) => {
  try {

    const totalOrders = await Order.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({
      totalOrders,
      totalBooks,
      totalUsers
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching stats"
    });
  }
};


// =====================
// Orders
// =====================
const getOrders = async (req, res) => {

  try {

    const orders = await Order.find();

    res.json(orders);

  } catch (error) {

    // fallback demo data
    res.json([
      {
        _id: "1",
        user: "Minh Chul",
        total: 50,
        status: "Pending"
      },
      {
        _id: "2",
        user: "Sophea",
        total: 30,
        status: "Delivered"
      }
    ]);
  }

};


// Update Order Status
const updateOrderStatus = (req, res) => {

  const { id } = req.params;
  const { status } = req.body;

  res.json({
    message: `Order ${id} updated to ${status}`
  });

};


// =====================
// Users
// =====================
const getUsers = (req, res) => {

  res.json([
    {
      id:1,
      name:"Minh Chul",
      email:"minchul@example.com",
      role:"Customer"
    },
    {
      id:2,
      name:"Sophea",
      email:"sophea@example.com",
      role:"Admin"
    }
  ]);

};


// =====================
// Reports
// =====================
const getReports = (req, res) => {

  res.json([
    {
      id:1,
      title:"Monthly Sales",
      value:"$12,000"
    },
    {
      id:2,
      title:"Orders Completed",
      value:"210"
    }
  ]);

};


// =====================
// Books
// =====================
const getBooksAdmin = (req, res) => {

  res.json([
    {
      id:1,
      title:"Book A",
      stock:15
    },
    {
      id:2,
      title:"Book B",
      stock:8
    }
  ]);

};


// =====================
// Categories
// =====================
const getCategories = (req, res) => {

  res.json([
    "Fiction",
    "Science",
    "Technology"
  ]);

};


// =====================
// Quantities
// =====================
const getQuantities = (req, res) => {

  res.json([
    {
      item:"Book A",
      quantity:15
    },
    {
      item:"Book B",
      quantity:8
    }
  ]);

};


// =====================
// Export All
// =====================
module.exports = {
  getStats,
  getOrders,
  updateOrderStatus,
  getUsers,
  getReports,
  getBooksAdmin,
  getCategories,
  getQuantities
};