const StockItem = require("../Models/StockItem");

class StockItemService {
  constructor(repository) {
    if (!repository) {
      throw new Error("StockItemService requires a repository instance");
    }

    this.repository = repository;
  }

  async listo(filters = {}) {
    const normalizedFilters = this.#normalizeFilters(filters);

    try {
      const items = await this.repository.getAll();

      return this.#sortItems(
        items
          .map((item) => item.toJSON())
          .filter((item) => {
            if (
              normalizedFilters.search &&
              !item.name
                .toLowerCase()
                .includes(normalizedFilters.search) &&
              !item.item_code
                .toLowerCase()
                .includes(normalizedFilters.search) &&
              !item.supplier
                .toLowerCase()
                .includes(normalizedFilters.search)
            ) {
              return false;
            }

            if (
              normalizedFilters.category &&
              item.category.toLowerCase() !== normalizedFilters.category
            ) {
              return false;
            }

            if (normalizedFilters.onlyLowStock && !item.is_low_stock) {
              return false;
            }

            if (normalizedFilters.onlyActive && !item.is_active) {
              return false;
            }

            return true;
          }),
        normalizedFilters
      );
    } catch (error) {
      throw this.#wrapError(error, "Nuk u arrit leximi i artikujve të stokut.");
    }
  }

  async shto(data) {
    const normalized = this.#normalizeInput(data);
    this.#validate(normalized);

    try {
      const created = await this.repository.add(new StockItem(normalized));
      return created.toJSON();
    } catch (error) {
      throw this.#wrapError(error, "Nuk u arrit ruajtja e artikullit të stokut.");
    }
  }

  async gjejSipasId(id) {
    const parsedId = this.#parseId(id);

    try {
      const item = await this.repository.getById(parsedId);

      if (!item) {
        throw this.#createError(`Artikulli me ID ${parsedId} nuk u gjet.`, 404);
      }

      return item.toJSON();
    } catch (error) {
      throw this.#wrapError(
        error,
        `Nuk u arrit leximi i artikullit me ID ${parsedId}.`
      );
    }
  }

  async perditeso(id, data) {
    const current = await this.gjejSipasId(id);
    const normalized = this.#normalizeInput({
      ...current,
      ...data,
      id: current.id,
      created_at: current.created_at,
    });

    this.#validate(normalized);

    try {
      const updated = await this.repository.update(current.id, normalized);

      if (!updated) {
        throw this.#createError(`Artikulli me ID ${current.id} nuk u gjet.`, 404);
      }

      return updated.toJSON();
    } catch (error) {
      throw this.#wrapError(
        error,
        `Nuk u arrit përditësimi i artikullit me ID ${current.id}.`
      );
    }
  }

  async fshi(id) {
    const parsedId = this.#parseId(id);

    try {
      const deleted = await this.repository.delete(parsedId);

      if (!deleted) {
        throw this.#createError(`Artikulli me ID ${parsedId} nuk u gjet.`, 404);
      }

      return {
        ok: true,
        message: `Artikulli me ID ${parsedId} u fshi me sukses.`,
      };
    } catch (error) {
      throw this.#wrapError(
        error,
        `Nuk u arrit fshirja e artikullit me ID ${parsedId}.`
      );
    }
  }

  async statistika(filters = {}) {
    const items = await this.listo(filters);
    const totalInventoryValue = items.reduce(
      (sum, item) => sum + item.current_qty * item.unit_cost,
      0
    );

    return {
      total_items: items.length,
      active_items: items.filter((item) => item.is_active).length,
      low_stock_items: items.filter((item) => item.is_low_stock).length,
      total_inventory_value: Number(totalInventoryValue.toFixed(2)),
    };
  }

  #normalizeInput(data) {
    return {
      id: data.id,
      item_code: String(data.item_code ?? "").trim(),
      name: String(data.name ?? "").trim(),
      category: String(data.category ?? "General").trim(),
      unit: String(data.unit ?? "pcs").trim(),
      current_qty: Number(data.current_qty ?? 0),
      min_qty: Number(data.min_qty ?? 0),
      unit_cost: Number(data.unit_cost ?? 0),
      supplier: String(data.supplier ?? "Unknown").trim(),
      location: String(data.location ?? "Main shelf").trim(),
      is_active:
        data.is_active === undefined ? true : this.#toBoolean(data.is_active),
      created_at: data.created_at ?? new Date().toISOString(),
    };
  }

  #validate(item) {
    if (!item.name) {
      throw this.#createError("Emri i artikullit nuk mund të jetë bosh.", 400);
    }

    if (item.name.length < 3) {
      throw this.#createError(
        "Emri i artikullit duhet të ketë të paktën 3 karaktere.",
        400
      );
    }

    if (Number.isNaN(item.unit_cost) || item.unit_cost <= 0) {
      throw this.#createError("Çmimi duhet të jetë numër më i madh se 0.", 400);
    }

    if (Number.isNaN(item.current_qty) || item.current_qty < 0) {
      throw this.#createError("Sasia aktuale nuk mund të jetë negative.", 400);
    }

    if (Number.isNaN(item.min_qty) || item.min_qty < 0) {
      throw this.#createError("Sasia minimale nuk mund të jetë negative.", 400);
    }

    if (!item.item_code) {
      throw this.#createError("Kodi i artikullit është i detyrueshëm.", 400);
    }
  }

  #parseId(id) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw this.#createError("ID duhet të jetë numër i plotë pozitiv.", 400);
    }

    return parsedId;
  }

  #normalizeFilters(filters) {
    return {
      search: this.#readOptionalText(filters.search, "search").toLowerCase(),
      category: this.#readOptionalText(filters.category, "category").toLowerCase(),
      onlyLowStock: this.#parseOptionalBoolean(
        filters.onlyLowStock,
        "onlyLowStock"
      ),
      onlyActive: this.#parseOptionalBoolean(filters.onlyActive, "onlyActive"),
      sortBy: this.#parseSortBy(filters.sortBy),
      sortOrder: this.#parseSortOrder(filters.sortOrder),
    };
  }

  #readOptionalText(value, fieldName) {
    if (Array.isArray(value)) {
      throw this.#createError(`${fieldName} duhet të jepet vetëm një herë.`, 400);
    }

    return String(value ?? "").trim();
  }

  #parseOptionalBoolean(value, fieldName) {
    if (value === undefined || value === null || value === "") {
      return false;
    }

    if (Array.isArray(value)) {
      throw this.#createError(`${fieldName} duhet të jepet vetëm një herë.`, 400);
    }

    const normalized = String(value).trim().toLowerCase();

    if (["true", "1", "yes", "po"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "jo"].includes(normalized)) {
      return false;
    }

    throw this.#createError(`${fieldName} duhet të jetë true ose false.`, 400);
  }

  #toBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }

    return ["true", "1", "yes", "po"].includes(
      String(value).trim().toLowerCase()
    );
  }

  #parseSortBy(value) {
    const normalized = this.#readOptionalText(value, "sortBy");

    if (!normalized) {
      return "id";
    }

    const validFields = new Set([
      "id",
      "name",
      "category",
      "current_qty",
      "min_qty",
      "unit_cost",
      "created_at",
    ]);

    if (!validFields.has(normalized)) {
      throw this.#createError(
        "sortBy lejohet vetëm për: id, name, category, current_qty, min_qty, unit_cost, created_at.",
        400
      );
    }

    return normalized;
  }

  #parseSortOrder(value) {
    const normalized = this.#readOptionalText(value, "sortOrder").toLowerCase();

    if (!normalized) {
      return "asc";
    }

    if (!["asc", "desc"].includes(normalized)) {
      throw this.#createError("sortOrder duhet të jetë asc ose desc.", 400);
    }

    return normalized;
  }

  #sortItems(items, filters) {
    const direction = filters.sortOrder === "desc" ? -1 : 1;

    return [...items].sort((left, right) => {
      const leftValue = left[filters.sortBy];
      const rightValue = right[filters.sortBy];

      if (
        filters.sortBy === "name" ||
        filters.sortBy === "category" ||
        filters.sortBy === "created_at"
      ) {
        return (
          String(leftValue).localeCompare(String(rightValue), undefined, {
            sensitivity: "base",
            numeric: true,
          }) * direction
        );
      }

      return (Number(leftValue) - Number(rightValue)) * direction;
    });
  }

  #createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  #wrapError(error, fallbackMessage) {
    if (error?.statusCode) {
      return error;
    }

    return this.#createError(fallbackMessage, 500);
  }
}

module.exports = StockItemService;
