const pool = require("../db/pool");
const createHttpError = require("../utils/createHttpError");

class AppointmentService {
  async getAll(filters = {}) {
    const normalizedFilters = this.#normalizeFilters(filters);
    const values = [];
    let paramIndex = 1;

    let query = `
      SELECT
        a.id,
        a.service_date,
        a.issue_description,
        a.status,
        a.created_at,
        c.full_name AS client_name,
        c.phone AS client_phone,
        c.company_name,
        t.plate_number,
        t.brand,
        t.model
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      JOIN trucks t ON t.id = a.truck_id
      WHERE 1=1
    `;

    if (normalizedFilters.service_date) {
      query += ` AND a.service_date = $${paramIndex}`;
      values.push(normalizedFilters.service_date);
      paramIndex++;
    }

    if (normalizedFilters.from) {
      query += ` AND a.service_date >= $${paramIndex}`;
      values.push(normalizedFilters.from);
      paramIndex++;
    }

    if (normalizedFilters.to) {
      query += ` AND a.service_date <= $${paramIndex}`;
      values.push(normalizedFilters.to);
      paramIndex++;
    }

    if (normalizedFilters.status) {
      query += ` AND a.status = $${paramIndex}`;
      values.push(normalizedFilters.status);
      paramIndex++;
    }

    query += " ORDER BY a.service_date ASC, a.created_at DESC";

    const result = await pool.query(query, values);
    return result.rows;
  }

  async create(data, userId) {
    const input = this.#normalizeCreateInput(data);
    const createdBy = this.#parsePositiveInteger(userId, "created_by");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const clientResult = await client.query(
        `
        INSERT INTO clients (full_name, phone, company_name, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id, full_name, phone, company_name
        `,
        [input.client_name, input.client_phone, input.company_name, null]
      );

      const truckResult = await client.query(
        `
        INSERT INTO trucks (plate_number, brand, model, client_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (plate_number)
        DO UPDATE SET
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          client_id = EXCLUDED.client_id
        RETURNING id, plate_number, brand, model
        `,
        [
          input.plate_number,
          input.brand,
          input.model,
          clientResult.rows[0].id,
        ]
      );

      const appointmentResult = await client.query(
        `
        INSERT INTO appointments
          (client_id, truck_id, service_date, issue_description, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, service_date, issue_description, status, created_at
        `,
        [
          clientResult.rows[0].id,
          truckResult.rows[0].id,
          input.service_date,
          input.issue_description,
          input.status,
          createdBy,
        ]
      );

      await client.query("COMMIT");

      return {
        ...appointmentResult.rows[0],
        client_name: clientResult.rows[0].full_name,
        client_phone: clientResult.rows[0].phone,
        company_name: clientResult.rows[0].company_name,
        plate_number: truckResult.rows[0].plate_number,
        brand: truckResult.rows[0].brand,
        model: truckResult.rows[0].model,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw this.#wrapError(error, "Server error while creating appointment");
    } finally {
      client.release();
    }
  }

  async updateStatus(id, data) {
    const appointmentId = this.#parsePositiveInteger(id, "id");
    const status = this.#parseStatus(data.status, true);

    const result = await pool.query(
      `
      UPDATE appointments
      SET status = $1
      WHERE id = $2
      RETURNING id, service_date, issue_description, status, created_at
      `,
      [status, appointmentId]
    );

    if (result.rows.length === 0) {
      throw createHttpError("Appointment was not found", 404);
    }

    return result.rows[0];
  }

  #normalizeCreateInput(data = {}) {
    const clientName = this.#readRequiredText(data.client_name, "client_name");
    const plateNumber = this.#readRequiredText(data.plate_number, "plate_number").toUpperCase();
    const brand = this.#readRequiredText(data.brand, "brand");
    const serviceDate = this.#readRequiredText(data.service_date, "service_date");
    const status = this.#parseStatus(data.status) || "SCHEDULED";

    if (!this.#isValidDate(serviceDate)) {
      throw createHttpError("service_date must be a valid date in YYYY-MM-DD format", 400);
    }

    return {
      client_name: clientName,
      client_phone: this.#readOptionalText(data.client_phone, "client_phone"),
      company_name: this.#readOptionalText(data.company_name, "company_name"),
      plate_number: plateNumber,
      brand,
      model: this.#readOptionalText(data.model, "model"),
      service_date: serviceDate,
      issue_description: this.#readOptionalText(
        data.issue_description,
        "issue_description"
      ),
      status,
    };
  }

  #normalizeFilters(filters = {}) {
    const serviceDate = this.#readOptionalText(filters.service_date, "service_date");
    const from = this.#readOptionalText(filters.from, "from");
    const to = this.#readOptionalText(filters.to, "to");
    const status = this.#parseStatus(filters.status, false);

    if (serviceDate && !this.#isValidDate(serviceDate)) {
      throw createHttpError("service_date must be a valid date in YYYY-MM-DD format", 400);
    }

    if (from && !this.#isValidDate(from)) {
      throw createHttpError("from must be a valid date in YYYY-MM-DD format", 400);
    }

    if (to && !this.#isValidDate(to)) {
      throw createHttpError("to must be a valid date in YYYY-MM-DD format", 400);
    }

    return {
      service_date: serviceDate,
      from,
      to,
      status,
    };
  }

  #parseStatus(status, required = false) {
    const normalized = this.#readOptionalText(status, "status").toUpperCase();

    if (!normalized) {
      if (required) {
        throw createHttpError("status is required", 400);
      }

      return required ? "SCHEDULED" : "";
    }

    if (!["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"].includes(normalized)) {
      throw createHttpError(
        "status must be SCHEDULED, IN_PROGRESS, DONE, or CANCELLED",
        400
      );
    }

    return normalized;
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

  #wrapError(error, fallbackMessage) {
    if (error?.statusCode) {
      return error;
    }

    return createHttpError(fallbackMessage, 500);
  }
}

module.exports = AppointmentService;
