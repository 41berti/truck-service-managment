require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/transactions", transactionRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
  });
});

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    res.json({
      ok: true,
      message: "Database connection successful",
      db: result.rows[0],
    });
  } catch (error) {
    console.error("DB health check failed:", error.message);
    res.status(500).json({
      ok: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.get("/health/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users ORDER BY id ASC"
    );

    res.json({
      ok: true,
      count: result.rowCount,
      users: result.rows,
    });
  } catch (error) {
    console.error("Users health check failed:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "ScaniaTrans backend API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});