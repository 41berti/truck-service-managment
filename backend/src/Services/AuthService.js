const bcrypt = require("bcrypt");
const pool = require("../db/pool");
const generateToken = require("../utils/generateToken");
const User = require("../Models/User");

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
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
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const row = result.rows[0];

    if (!row.is_active) {
      const error = new Error("User account is inactive");
      error.statusCode = 403;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(password, row.password_hash);

    if (!passwordMatches) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
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
  }

  async getCurrentUser(userId) {
    const result = await pool.query(
      `
      SELECT id, full_name, email, role, is_active
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return new User(result.rows[0]).toJSON();
  }
}

module.exports = AuthService;