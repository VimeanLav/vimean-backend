const getStats = (req, res) => {
  res.json({
    totalOrders: 120,
    newOrders: 30,
    deliveredOrders: 80,
    cancelledOrders: 10,
    totalBooks: 50,
    totalUsers: 200
  });
};

module.exports = { getStats };