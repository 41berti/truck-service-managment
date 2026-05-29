require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const stockRoutes = require("./routes/stockRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const asyncHandler = require("./utils/asyncHandler");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();

const allowedOrigins = String(process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/stock", stockRoutes);
app.use("/transactions", transactionRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/appointments", appointmentRoutes);

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
