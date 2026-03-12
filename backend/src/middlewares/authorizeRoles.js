function authorizeRoles(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "User information is missing",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: "Access denied",
      });
    }

    next();
  };
}

module.exports = authorizeRoles;