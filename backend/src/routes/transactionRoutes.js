const express = require("express");
const pool = require("../db/pool");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

function isValidDate(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

async function createTransaction(req, res, type) {
  try {
    const { amount, description, category, tx_date } = req.body;

    if (
      amount === undefined ||
      !description ||
      !category ||
      !tx_date
    ) {
      return res.status(400).json({
        ok: false,
        message: "amount, description, category, and tx_date are required",
      });
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Amount must be a number greater than 0",
      });
    }

    if (!isValidDate(tx_date)) {
      return res.status(400).json({
        ok: false,
        message: "tx_date must be in YYYY-MM-DD format",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO transactions (type, amount, description, category, tx_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, type, amount, description, category, tx_date, created_by, created_at
      `,
      [type, numericAmount, description, category, tx_date, req.user.id]
    );

    return res.status(201).json({
      ok: true,
      message: `${type === "INCOME" ? "Income" : "Expense"} transaction created successfully`,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error while creating transaction",
    });
  }
}

/*
  POST /transactions/income
  Admin only
*/
router.post(
  "/income",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    await createTransaction(req, res, "INCOME");
  }
);

/*
  POST /transactions/expense
  Admin only
*/
router.post(
  "/expense",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    await createTransaction(req, res, "EXPENSE");
  }
);

/*
  GET /transactions
  Admin only
  Optional query params:
  - type=INCOME or EXPENSE
  - from=YYYY-MM-DD
  - to=YYYY-MM-DD
*/
router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { type, from, to } = req.query;

      let query = `
        SELECT
          t.id,
          t.type,
          t.amount,
          t.description,
          t.category,
          t.tx_date,
          t.created_at,
          u.full_name AS created_by_name
        FROM transactions t
        JOIN users u ON u.id = t.created_by
        WHERE 1=1
      `;

      const values = [];
      let paramIndex = 1;

      if (type) {
        query += ` AND t.type = $${paramIndex}`;
        values.push(type);
        paramIndex++;
      }

      if (from) {
        query += ` AND t.tx_date >= $${paramIndex}`;
        values.push(from);
        paramIndex++;
      }

      if (to) {
        query += ` AND t.tx_date <= $${paramIndex}`;
        values.push(to);
        paramIndex++;
      }

      query += ` ORDER BY t.tx_date DESC, t.created_at DESC`;

      const result = await pool.query(query, values);

      return res.status(200).json({
        ok: true,
        count: result.rowCount,
        transactions: result.rows,
      });
    } catch (error) {
      console.error("List transactions error:", error);

      return res.status(500).json({
        ok: false,
        message: "Server error while fetching transactions",
      });
    }
  }
);

/*
  GET /transactions/summary
  Admin only
  Optional query params:
  - from=YYYY-MM-DD
  - to=YYYY-MM-DD
*/
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      let query = `
        SELECT
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense,
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0) AS balance
        FROM transactions
        WHERE 1=1
      `;

      const values = [];
      let paramIndex = 1;

      if (from) {
        query += ` AND tx_date >= $${paramIndex}`;
        values.push(from);
        paramIndex++;
      }

      if (to) {
        query += ` AND tx_date <= $${paramIndex}`;
        values.push(to);
        paramIndex++;
      }

      const result = await pool.query(query, values);

      return res.status(200).json({
        ok: true,
        summary: result.rows[0],
      });
    } catch (error) {
      console.error("Transaction summary error:", error);

      return res.status(500).json({
        ok: false,
        message: "Server error while fetching summary",
      });
    }
  }
);

module.exports = router;