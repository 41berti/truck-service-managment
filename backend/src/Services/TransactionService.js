const pool = require("../db/pool");
const Transaction = require("../Models/Transaction");

class TransactionService {
  isValidDate(dateString) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }

  async create(type, data, userId) {
    const { amount, description, category, tx_date } = data;

    if (amount === undefined || !description || !category || !tx_date) {
      const error = new Error(
        "amount, description, category, and tx_date are required"
      );
      error.statusCode = 400;
      throw error;
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      const error = new Error("Amount must be a number greater than 0");
      error.statusCode = 400;
      throw error;
    }

    if (!this.isValidDate(tx_date)) {
      const error = new Error("tx_date must be in YYYY-MM-DD format");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
      INSERT INTO transactions (type, amount, description, category, tx_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, type, amount, description, category, tx_date, created_by, created_at
      `,
      [type, numericAmount, description, category, tx_date, userId]
    );

    return new Transaction(result.rows[0]).toJSON();
  }

  async getAll(filters = {}) {
    const { type, from, to } = filters;

    let query = `
      SELECT
        t.id,
        t.type,
        t.amount,
        t.description,
        t.category,
        t.tx_date,
        t.created_by,
        t.created_at
      FROM transactions t
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

    return result.rows.map((row) => new Transaction(row).toJSON());
  }

  async getSummary(filters = {}) {
    const { from, to } = filters;

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
    return result.rows[0];
  }
}

module.exports = TransactionService;