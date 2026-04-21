const jwt = require("jsonwebtoken");
const createHttpError = require("../utils/createHttpError");

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(createHttpError("Access token is missing", 401));
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next(createHttpError("Invalid authorization format", 401));
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return next(createHttpError("Invalid or expired token", 401));
  }
}

module.exports = authenticateToken;
