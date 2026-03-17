exports.protect = (req, res, next) => {
  req.user = "dummy-user-id"; // later replace with JWT
  next();
};