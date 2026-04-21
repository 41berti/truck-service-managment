const bcrypt = require("bcrypt");
const pool = require("../db/pool");
const generateToken = require("../utils/generateToken");
const User = require("../Models/User");
const createHttpError = require("../utils/createHttpError");

class AuthService {
  async login(email, password) {
    try {
      if (!email || !password) {
        throw createHttpError("Email and password are required", 400);
      }

      const result = await pool.query(
        `
        SELECT id, full_name, email, password_hash, role, is_active
        FROM users
        WHERE email = $1
        `,
        [email]
      );

      if (result.rows.length === 0) {
        throw createHttpError("Invalid email or password", 401);
      }

      const row = result.rows[0];

      if (!row.is_active) {
        throw createHttpError("User account is inactive", 403);
      }

      const passwordMatches = await bcrypt.compare(password, row.password_hash);

      if (!passwordMatches) {
        throw createHttpError("Invalid email or password", 401);
      }

      const user = new User(row);
      const token = generateToken({
        id: row.id,
        email: row.email,
        role: row.role,
      });

      return {
        token,
        user: user.toJSON(),
      };
    } catch (error) {
      throw this.#wrapError(error, "Server error during login");
    }
  }

  async getCurrentUser(userId) {
    try {
      const result = await pool.query(
        `
        SELECT id, full_name, email, role, is_active
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      if (result.rows.length === 0) {
        throw createHttpError("User not found", 404);
      }

      return new User(result.rows[0]).toJSON();
    } catch (error) {
      throw this.#wrapError(error, "Server error while fetching current user");
    }
  }

  #wrapError(error, fallbackMessage) {
    if (error?.statusCode) {
      return error;
    }

    return createHttpError(fallbackMessage, 500);
  }
}

module.exports = AuthService;
