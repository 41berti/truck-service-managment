const pool = require("../db/pool");
const Transaction = require("../Models/Transaction");
const createHttpError = require("../utils/createHttpError");

class TransactionService {
  isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return false;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() + 1 === month &&
      parsedDate.getUTCDate() === day
    );
  }

  async create(type, data, userId) {
    try {
      const normalizedType = this.#parseType(type, true);
      const normalizedInput = this.#normalizeCreateInput(data);
      const numericAmount = Number(normalizedInput.amount);
      const normalizedUserId = this.#parseUserId(userId);

      if (
        normalizedInput.amount === undefined ||
        !normalizedInput.description ||
        !normalizedInput.category ||
        !normalizedInput.tx_date
      ) {
        throw createHttpError(
          "amount, description, category, and tx_date are required",
          400
        );
      }

      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        throw createHttpError("Amount must be a number greater than 0", 400);
      }

      if (!this.isValidDate(normalizedInput.tx_date)) {
        throw createHttpError(
          "tx_date must be a valid date in YYYY-MM-DD format",
          400
        );
      }

      const result = await pool.query(
        `
        INSERT INTO transactions (type, amount, description, category, tx_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, type, amount, description, category, tx_date, created_by, created_at
        `,
        [
          normalizedType,
          numericAmount,
          normalizedInput.description,
          normalizedInput.category,
          normalizedInput.tx_date,
          normalizedUserId,
        ]
      );

      return new Transaction(result.rows[0]).toJSON();
    } catch (error) {
      throw this.#wrapError(error, "Server error while creating transaction");
    }
  }

  async getAll(filters = {}) {
    try {
      const normalizedFilters = this.#normalizeFilters(filters, {
        allowType: true,
      });

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

      if (normalizedFilters.type) {
        query += ` AND t.type = $${paramIndex}`;
        values.push(normalizedFilters.type);
        paramIndex++;
      }

      if (normalizedFilters.from) {
        query += ` AND t.tx_date >= $${paramIndex}`;
        values.push(normalizedFilters.from);
        paramIndex++;
      }

      if (normalizedFilters.to) {
        query += ` AND t.tx_date <= $${paramIndex}`;
        values.push(normalizedFilters.to);
        paramIndex++;
      }

      query += ` ORDER BY t.tx_date DESC, t.created_at DESC`;

      const result = await pool.query(query, values);

      return result.rows.map((row) => new Transaction(row).toJSON());
    } catch (error) {
      throw this.#wrapError(error, "Server error while fetching transactions");
    }
  }

  async getSummary(filters = {}) {
    try {
      const normalizedFilters = this.#normalizeFilters(filters);

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

      if (normalizedFilters.from) {
        query += ` AND tx_date >= $${paramIndex}`;
        values.push(normalizedFilters.from);
        paramIndex++;
      }

      if (normalizedFilters.to) {
        query += ` AND tx_date <= $${paramIndex}`;
        values.push(normalizedFilters.to);
        paramIndex++;
      }

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw this.#wrapError(error, "Server error while fetching summary");
    }
  }

  #normalizeCreateInput(data = {}) {
    return {
      amount: data.amount,
      description: String(data.description ?? "").trim(),
      category: String(data.category ?? "").trim(),
      tx_date: String(data.tx_date ?? "").trim(),
    };
  }

  #normalizeFilters(filters = {}, options = {}) {
    const normalizedType = options.allowType
      ? this.#parseType(filters.type, false)
      : "";
    const from = this.#readOptionalText(filters.from, "from");
    const to = this.#readOptionalText(filters.to, "to");

    if (from && !this.isValidDate(from)) {
      throw createHttpError(
        "from must be a valid date in YYYY-MM-DD format",
        400
      );
    }

    if (to && !this.isValidDate(to)) {
      throw createHttpError("to must be a valid date in YYYY-MM-DD format", 400);
    }

    if (from && to && from > to) {
      throw createHttpError("from date must be earlier than or equal to to date", 400);
    }

    return {
      type: normalizedType,
      from,
      to,
    };
  }

  #parseType(type, required) {
    const normalizedType = this.#readOptionalText(type, "type").toUpperCase();

    if (!normalizedType) {
      if (required) {
        throw createHttpError("Transaction type is required", 400);
      }

      return "";
    }

    if (!["INCOME", "EXPENSE"].includes(normalizedType)) {
      throw createHttpError("type must be either INCOME or EXPENSE", 400);
    }

    return normalizedType;
  }

  #parseUserId(userId) {
    const normalizedUserId = Number(userId);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
      throw createHttpError("created_by user must be a positive integer", 400);
    }

    return normalizedUserId;
  }

  #readOptionalText(value, fieldName) {
    if (Array.isArray(value)) {
      throw createHttpError(`${fieldName} must be provided only once`, 400);
    }

    return String(value ?? "").trim();
  }

  #wrapError(error, fallbackMessage) {
    if (error?.statusCode) {
      return error;
    }

    return createHttpError(fallbackMessage, 500);
  }
}

module.exports = TransactionService;
