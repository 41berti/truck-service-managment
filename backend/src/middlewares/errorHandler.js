const createHttpError = require("../utils/createHttpError");

function notFoundHandler(req, res, next) {
  next(createHttpError("Requested route was not found.", 404));
}

function errorHandler(error, req, res, next) {
  const statusCode =
    Number.isInteger(error?.statusCode) && error.statusCode >= 400
      ? error.statusCode
      : 500;

  if (statusCode >= 500) {
    console.error(
      `[${req.method} ${req.originalUrl}]`,
      error?.stack || error?.message || error
    );
  }

  res.status(statusCode).json({
    ok: false,
    message: error?.message || "Internal server error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
