const createHttpError = require("../utils/createHttpError");

function authorizeRoles(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(createHttpError("User information is missing", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createHttpError("Access denied", 403));
    }

    next();
  };
}

module.exports = authorizeRoles;
