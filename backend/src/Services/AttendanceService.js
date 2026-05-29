const pool = require("../db/pool");
const createHttpError = require("../utils/createHttpError");

class AttendanceService {
  async listUsers() {
    const result = await pool.query(
      `
      SELECT id, full_name, email, role, is_active
      FROM users
      WHERE is_active = TRUE
      ORDER BY full_name ASC
      `
    );

    return result.rows;
  }

  async getAll(filters = {}) {
    const normalizedFilters = this.#normalizeFilters(filters);
    const values = [];
    let paramIndex = 1;

    let query = `
      SELECT
        a.id,
        a.user_id,
        u.full_name AS employee_name,
        u.role AS employee_role,
        a.work_date,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE 1=1
    `;

    if (normalizedFilters.work_date) {
      query += ` AND a.work_date = $${paramIndex}`;
      values.push(normalizedFilters.work_date);
      paramIndex++;
    }

    if (normalizedFilters.from) {
      query += ` AND a.work_date >= $${paramIndex}`;
      values.push(normalizedFilters.from);
      paramIndex++;
    }

    if (normalizedFilters.to) {
      query += ` AND a.work_date <= $${paramIndex}`;
      values.push(normalizedFilters.to);
      paramIndex++;
    }

    if (normalizedFilters.user_id) {
      query += ` AND a.user_id = $${paramIndex}`;
      values.push(normalizedFilters.user_id);
      paramIndex++;
    }

    query += " ORDER BY a.work_date DESC, a.check_in DESC";

    const result = await pool.query(query, values);
    return result.rows.map((row) => this.#toAttendanceJson(row));
  }

  async create(data) {
    const input = this.#normalizeCreateInput(data);

    try {
      const existingResult = await pool.query(
        `
        SELECT
          a.id,
          a.user_id,
          u.full_name AS employee_name,
          u.role AS employee_role,
          a.work_date,
          a.check_in,
          a.check_out,
          a.notes,
          a.created_at
        FROM attendance a
        JOIN users u ON u.id = a.user_id
        WHERE a.user_id = $1 AND a.work_date = $2
        `,
        [input.user_id, input.work_date]
      );

      if (existingResult.rows.length > 0) {
        const existing = this.#toAttendanceJson(existingResult.rows[0]);

        if (!existing.check_out && input.check_out) {
          return this.checkOut(existing.id, { check_out: input.check_out });
        }

        if (!existing.check_out) {
          throw createHttpError(
            "Punëtori është tashmë i regjistruar në hyrje për këtë datë. Përdor veprimin Dalje për ta mbyllur prezencën.",
            409
          );
        }

        throw createHttpError(
          "Ky punëtor e ka përfunduar tashmë prezencën për këtë datë.",
          409
        );
      }

      const result = await pool.query(
        `
        INSERT INTO attendance
          (user_id, work_date, check_in, signature_in_url, check_out, signature_out_url, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, work_date, check_in, check_out, notes, created_at
        `,
        [
          input.user_id,
          input.work_date,
          input.check_in,
          "manual-entry",
          input.check_out,
          input.check_out ? "manual-entry" : null,
          input.notes,
        ]
      );

      const created = result.rows[0];
      const users = await this.listUsers();
      const employee = users.find((user) => Number(user.id) === Number(created.user_id));

      return this.#toAttendanceJson({
        ...created,
        employee_name: employee?.full_name || "",
        employee_role: employee?.role || "",
      });
    } catch (error) {
      if (error?.code === "23505") {
        throw createHttpError("Ky punëtor ka tashmë evidencë për këtë datë.", 409);
      }

      throw this.#wrapError(error, "Server error while creating attendance record");
    }
  }

  async checkOut(id, data, actor = null) {
    const attendanceId = this.#parsePositiveInteger(id, "id");
    const checkOut = this.#readRequiredText(data.check_out, "check_out");

    if (!this.#isValidDateTime(checkOut)) {
      throw createHttpError("check_out must be a valid date/time", 400);
    }

    const currentResult = await pool.query(
      `
      SELECT
        a.id,
        a.user_id,
        u.full_name AS employee_name,
        u.role AS employee_role,
        a.work_date,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = $1
      ${actor?.role && actor.role !== "ADMIN" ? "AND a.user_id = $2" : ""}
      `,
      actor?.role && actor.role !== "ADMIN"
        ? [attendanceId, actor.id]
        : [attendanceId]
    );

    if (currentResult.rows.length === 0) {
      throw createHttpError("Attendance record was not found.", 404);
    }

    const current = currentResult.rows[0];

    if (current.check_out) {
      throw createHttpError("Dalja është regjistruar tashmë për këtë prezencë.", 409);
    }

    if (new Date(checkOut) <= new Date(current.check_in)) {
      throw createHttpError("Ora e daljes duhet të jetë pas orës së hyrjes.", 400);
    }

    const result = await pool.query(
      `
      UPDATE attendance
      SET check_out = $1, signature_out_url = $2
      WHERE id = $3
      RETURNING id, user_id, work_date, check_in, check_out, notes, created_at
      `,
      [checkOut, "manual-entry", attendanceId]
    );

    const created = result.rows[0];
    const users = await this.listUsers();
    const employee = users.find((user) => Number(user.id) === Number(created.user_id));

    return this.#toAttendanceJson({
      ...created,
      employee_name: employee?.full_name || "",
      employee_role: employee?.role || "",
    });
  }

  async update(id, data) {
    const attendanceId = this.#parsePositiveInteger(id, "id");
    const currentResult = await pool.query(
      `
      SELECT id, user_id, work_date, check_in, check_out, notes
      FROM attendance
      WHERE id = $1
      `,
      [attendanceId]
    );

    if (currentResult.rows.length === 0) {
      throw createHttpError("Attendance record was not found.", 404);
    }

    const current = currentResult.rows[0];
    const input = this.#normalizeCreateInput({
      ...current,
      ...data,
      user_id: data.user_id ?? current.user_id,
      work_date: data.work_date ?? current.work_date,
      check_in: data.check_in ?? current.check_in,
      check_out: data.check_out ?? current.check_out,
      notes: data.notes ?? current.notes,
    });

    if (input.check_out && new Date(input.check_out) <= new Date(input.check_in)) {
      throw createHttpError("Ora e daljes duhet të jetë pas orës së hyrjes.", 400);
    }

    try {
      const result = await pool.query(
        `
        UPDATE attendance
        SET user_id = $1,
            work_date = $2,
            check_in = $3,
            check_out = $4,
            signature_out_url = $5,
            notes = $6
        WHERE id = $7
        RETURNING id, user_id, work_date, check_in, check_out, notes, created_at
        `,
        [
          input.user_id,
          input.work_date,
          input.check_in,
          input.check_out,
          input.check_out ? "manual-entry" : null,
          input.notes,
          attendanceId,
        ]
      );

      const updated = result.rows[0];
      const users = await this.listUsers();
      const employee = users.find((user) => Number(user.id) === Number(updated.user_id));

      return this.#toAttendanceJson({
        ...updated,
        employee_name: employee?.full_name || "",
        employee_role: employee?.role || "",
      });
    } catch (error) {
      if (error?.code === "23505") {
        throw createHttpError("Ky punëtor ka tashmë evidencë për këtë datë.", 409);
      }

      throw this.#wrapError(error, "Server error while updating attendance record");
    }
  }

  async delete(id) {
    const attendanceId = this.#parsePositiveInteger(id, "id");
    const result = await pool.query(
      `
      DELETE FROM attendance
      WHERE id = $1
      RETURNING id
      `,
      [attendanceId]
    );

    if (result.rows.length === 0) {
      throw createHttpError("Attendance record was not found.", 404);
    }

    return {
      ok: true,
      message: "Attendance record deleted successfully",
    };
  }

  #normalizeCreateInput(data = {}) {
    const userId = this.#parsePositiveInteger(data.user_id, "user_id");
    const workDate = this.#readRequiredText(data.work_date, "work_date");
    const checkIn = this.#readRequiredText(data.check_in, "check_in");
    const checkOut = this.#readOptionalText(data.check_out, "check_out");

    const normalizedWorkDate = this.#normalizeDateValue(workDate);

    if (!this.#isValidDate(normalizedWorkDate)) {
      throw createHttpError("work_date must be a valid date in YYYY-MM-DD format", 400);
    }

    if (!this.#isValidDateTime(checkIn)) {
      throw createHttpError("check_in must be a valid date/time", 400);
    }

    if (checkOut && !this.#isValidDateTime(checkOut)) {
      throw createHttpError("check_out must be a valid date/time", 400);
    }

    return {
      user_id: userId,
      work_date: normalizedWorkDate,
      check_in: checkIn,
      check_out: checkOut || null,
      notes: this.#readOptionalText(data.notes, "notes"),
    };
  }

  #normalizeFilters(filters = {}) {
    const workDate = this.#readOptionalText(filters.work_date, "work_date");
    const from = this.#readOptionalText(filters.from, "from");
    const to = this.#readOptionalText(filters.to, "to");
    const rawUserId = this.#readOptionalText(filters.user_id, "user_id");

    if (workDate && !this.#isValidDate(workDate)) {
      throw createHttpError("work_date must be a valid date in YYYY-MM-DD format", 400);
    }

    if (from && !this.#isValidDate(from)) {
      throw createHttpError("from must be a valid date in YYYY-MM-DD format", 400);
    }

    if (to && !this.#isValidDate(to)) {
      throw createHttpError("to must be a valid date in YYYY-MM-DD format", 400);
    }

    return {
      work_date: workDate,
      from,
      to,
      user_id: rawUserId ? this.#parsePositiveInteger(rawUserId, "user_id") : null,
    };
  }

  #parsePositiveInteger(value, fieldName) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw createHttpError(`${fieldName} must be a positive integer`, 400);
    }

    return parsed;
  }

  #readRequiredText(value, fieldName) {
    const normalized = this.#readOptionalText(value, fieldName);

    if (!normalized) {
      throw createHttpError(`${fieldName} is required`, 400);
    }

    return normalized;
  }

  #readOptionalText(value, fieldName) {
    if (Array.isArray(value)) {
      throw createHttpError(`${fieldName} must be provided only once`, 400);
    }

    return String(value ?? "").trim();
  }

  #normalizeDateValue(value) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value ?? "").trim().slice(0, 10);
  }

  #isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() + 1 === month &&
      parsedDate.getUTCDate() === day
    );
  }

  #isValidDateTime(value) {
    return !Number.isNaN(Date.parse(value));
  }

  #toAttendanceJson(row) {
    const checkIn = row.check_in ? new Date(row.check_in) : null;
    const checkOut = row.check_out ? new Date(row.check_out) : null;
    const totalHours =
      checkIn && checkOut
        ? Number(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2))
        : 0;

    return {
      id: row.id,
      user_id: row.user_id,
      employee_name: row.employee_name,
      employee_role: row.employee_role,
      work_date: row.work_date,
      check_in: row.check_in,
      check_out: row.check_out,
      total_hours: totalHours,
      notes: row.notes,
      created_at: row.created_at,
    };
  }

  #wrapError(error, fallbackMessage) {
    if (error?.statusCode) {
      return error;
    }

    return createHttpError(fallbackMessage, 500);
  }
}

module.exports = AttendanceService;
