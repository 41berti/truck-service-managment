require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const stockRoutes = require("./routes/stockRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const asyncHandler = require("./utils/asyncHandler");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/stock", stockRoutes);
app.use("/transactions", transactionRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
  });
});

app.get(
  "/health/db",
  asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT 1 AS ok");
    res.json({
      ok: true,
      message: "Database connection successful",
      db: result.rows[0],
    });
  })
);

app.get(
  "/health/users",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users ORDER BY id ASC"
    );

    res.json({
      ok: true,
      count: result.rowCount,
      users: result.rows,
    });
  })
);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "ScaniaTrans backend API is running",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
