const IRepository = require("./IRepository");
const CsvStockItemRepository = require("./CsvStockItemRepository");
const StockItem = require("../../Models/StockItem");
const pool = require("../../db/pool");

class PostgresStockItemRepository extends IRepository {
  #seeded = false;

  async #ensureSeeded() {
    if (this.#seeded) {
      return;
    }

    const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM stock_items");

    if (countResult.rows[0].count > 0) {
      await this.#ensureMovementBaseline();
      this.#seeded = true;
      return;
    }

    const csvRepository = new CsvStockItemRepository();
    const seedItems = await csvRepository.getAll();

    for (const item of seedItems) {
      const row = item.toJSON();
      await pool.query(
        `
        INSERT INTO stock_items
          (id, item_code, name, category, unit, current_qty, min_qty, unit_cost, supplier, location, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (item_code) DO NOTHING
        `,
        [
          row.id,
          row.item_code,
          row.name,
          row.category,
          row.unit,
          row.current_qty,
          row.min_qty,
          row.unit_cost,
          row.supplier,
          row.location,
          row.is_active,
          row.created_at,
        ]
      );

      await this.#recordMovement(row.id, "IN", row.current_qty, row.unit_cost, "Initial CSV stock sync");
    }

    await pool.query(
      "SELECT setval(pg_get_serial_sequence('stock_items', 'id'), COALESCE((SELECT MAX(id) FROM stock_items), 1), true)"
    );

    this.#seeded = true;
  }

  async #ensureMovementBaseline() {
    const movementResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM stock_movements"
    );

    if (movementResult.rows[0].count > 0) {
      return;
    }

    const itemsResult = await pool.query(
      `
      SELECT id, current_qty, unit_cost
      FROM stock_items
      WHERE current_qty > 0
      ORDER BY id ASC
      `
    );

    for (const item of itemsResult.rows) {
      await this.#recordMovement(
        item.id,
        "IN",
        item.current_qty,
        item.unit_cost,
        "Initial PostgreSQL stock baseline"
      );
    }
  }

  async getAll() {
    await this.#ensureSeeded();

    const result = await pool.query(
      `
      SELECT id, item_code, name, category, unit, current_qty, min_qty, unit_cost,
             supplier, location, is_active, created_at
      FROM stock_items
      ORDER BY id ASC
      `
    );

    return result.rows.map((row) => this.#toStockItem(row));
  }

  async getById(id) {
    await this.#ensureSeeded();
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    const result = await pool.query(
      `
      SELECT id, item_code, name, category, unit, current_qty, min_qty, unit_cost,
             supplier, location, is_active, created_at
      FROM stock_items
      WHERE id = $1
      `,
      [numericId]
    );

    return result.rows[0] ? this.#toStockItem(result.rows[0]) : null;
  }

  async add(entity) {
    await this.#ensureSeeded();
    const row =
      entity instanceof StockItem ? entity.toJSON() : new StockItem(entity).toJSON();

    try {
      const result = await pool.query(
        `
        INSERT INTO stock_items
          (item_code, name, category, unit, current_qty, min_qty, unit_cost, supplier, location, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, item_code, name, category, unit, current_qty, min_qty, unit_cost,
                  supplier, location, is_active, created_at
        `,
        [
          row.item_code,
          row.name,
          row.category,
          row.unit,
          row.current_qty,
          row.min_qty,
          row.unit_cost,
          row.supplier,
          row.location,
          row.is_active,
          row.created_at || new Date().toISOString(),
        ]
      );

      const created = this.#toStockItem(result.rows[0]);
      await this.#recordMovement(created.id, "IN", created.currentQty, created.unitCost, "Stock item created");

      return created;
    } catch (error) {
      if (error?.code === "23505") {
        throw this.#createRepositoryError("Kodi i artikullit ekziston tashmë.", error, 409);
      }

      throw this.#createRepositoryError("Nuk u arrit ruajtja e artikullit në PostgreSQL.", error);
    }
  }

  async update(id, updatedFields) {
    await this.#ensureSeeded();
    const current = await this.getById(id);

    if (!current) {
      return null;
    }

    const currentJson = current.toJSON();
    const row = new StockItem({
      ...currentJson,
      ...updatedFields,
      id: currentJson.id,
      created_at: currentJson.created_at,
    }).toJSON();

    try {
      const result = await pool.query(
        `
        UPDATE stock_items
        SET item_code = $1,
            name = $2,
            category = $3,
            unit = $4,
            current_qty = $5,
            min_qty = $6,
            unit_cost = $7,
            supplier = $8,
            location = $9,
            is_active = $10
        WHERE id = $11
        RETURNING id, item_code, name, category, unit, current_qty, min_qty, unit_cost,
                  supplier, location, is_active, created_at
        `,
        [
          row.item_code,
          row.name,
          row.category,
          row.unit,
          row.current_qty,
          row.min_qty,
          row.unit_cost,
          row.supplier,
          row.location,
          row.is_active,
          currentJson.id,
        ]
      );

      const updated = this.#toStockItem(result.rows[0]);
      const quantityDelta = Number(row.current_qty) - Number(currentJson.current_qty);

      if (quantityDelta !== 0) {
        await this.#recordMovement(
          updated.id,
          "ADJUST",
          Math.abs(quantityDelta),
          updated.unitCost,
          `Quantity adjusted by ${quantityDelta}`
        );
      }

      return updated;
    } catch (error) {
      if (error?.code === "23505") {
        throw this.#createRepositoryError("Kodi i artikullit ekziston tashmë.", error, 409);
      }

      throw this.#createRepositoryError("Nuk u arrit përditësimi i artikullit në PostgreSQL.", error);
    }
  }

  async delete(id) {
    await this.#ensureSeeded();
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return false;
    }

    await pool.query("DELETE FROM stock_movements WHERE stock_item_id = $1", [numericId]);
    const result = await pool.query("DELETE FROM stock_items WHERE id = $1 RETURNING id", [
      numericId,
    ]);

    return result.rows.length > 0;
  }

  async save() {
    return true;
  }

  async #recordMovement(stockItemId, movementType, quantity, unitCost, note) {
    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      return;
    }

    const userId = await this.#getMovementUserId();

    if (!userId) {
      return;
    }

    await pool.query(
      `
      INSERT INTO stock_movements
        (stock_item_id, movement_type, quantity, unit_cost, note, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [stockItemId, movementType, numericQuantity, unitCost, note, userId]
    );
  }

  async #getMovementUserId() {
    const result = await pool.query(
      `
      SELECT id
      FROM users
      WHERE is_active = TRUE
      ORDER BY CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END, id ASC
      LIMIT 1
      `
    );

    return result.rows[0]?.id || null;
  }

  #toStockItem(row) {
    return new StockItem({
      id: row.id,
      item_code: row.item_code,
      name: row.name,
      category: row.category,
      unit: row.unit,
      current_qty: row.current_qty,
      min_qty: row.min_qty,
      unit_cost: row.unit_cost,
      supplier: row.supplier,
      location: row.location,
      is_active: row.is_active,
      created_at: row.created_at,
    });
  }

  #createRepositoryError(message, cause, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.cause = cause;
    return error;
  }
}

module.exports = PostgresStockItemRepository;
