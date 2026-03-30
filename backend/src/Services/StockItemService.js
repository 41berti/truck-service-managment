const StockItem = require("../Models/StockItem");

class StockItemService {
  constructor(repository) {
    if (!repository) {
      throw new Error("StockItemService requires a repository instance");
    }

    this.repository = repository;
  }

  async listo(filters = {}) {
    const items = await this.repository.getAll();
    const search = String(filters.search ?? "").trim().toLowerCase();
    const category = String(filters.category ?? "").trim().toLowerCase();
    const onlyLowStock = this.#toBoolean(filters.onlyLowStock);
    const onlyActive = this.#toBoolean(filters.onlyActive);

    return items
      .filter((item) => {
        const json = item.toJSON();

        if (
          search &&
          !json.name.toLowerCase().includes(search) &&
          !json.item_code.toLowerCase().includes(search) &&
          !json.supplier.toLowerCase().includes(search)
        ) {
          return false;
        }

        if (category && json.category.toLowerCase() !== category) {
          return false;
        }

        if (onlyLowStock && !json.is_low_stock) {
          return false;
        }

        if (onlyActive && !json.is_active) {
          return false;
        }

        return true;
      })
      .map((item) => item.toJSON());
  }

  async shto(data) {
    const normalized = this.#normalizeInput(data);
    this.#validate(normalized);

    const created = await this.repository.add(new StockItem(normalized));
    return created.toJSON();
  }

  async gjejSipasId(id) {
    const parsedId = this.#parseId(id);
    const item = await this.repository.getById(parsedId);

    if (!item) {
      const error = new Error(`Artikulli me ID ${parsedId} nuk u gjet.`);
      error.statusCode = 404;
      throw error;
    }

    return item.toJSON();
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

    const updated = await this.repository.update(current.id, normalized);
    return updated.toJSON();
  }

  async fshi(id) {
    const parsedId = this.#parseId(id);
    const deleted = await this.repository.delete(parsedId);

    if (!deleted) {
      const error = new Error(`Artikulli me ID ${parsedId} nuk u gjet.`);
      error.statusCode = 404;
      throw error;
    }

    return {
      ok: true,
      message: `Artikulli me ID ${parsedId} u fshi me sukses.`,
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
      const error = new Error("Emri i artikullit nuk mund të jetë bosh.");
      error.statusCode = 400;
      throw error;
    }

    if (Number.isNaN(item.unit_cost) || item.unit_cost <= 0) {
      const error = new Error("Çmimi duhet të jetë numër më i madh se 0.");
      error.statusCode = 400;
      throw error;
    }

    if (Number.isNaN(item.current_qty) || item.current_qty < 0) {
      const error = new Error("Sasia aktuale nuk mund të jetë negative.");
      error.statusCode = 400;
      throw error;
    }

    if (Number.isNaN(item.min_qty) || item.min_qty < 0) {
      const error = new Error("Sasia minimale nuk mund të jetë negative.");
      error.statusCode = 400;
      throw error;
    }

    if (!item.item_code) {
      const error = new Error("Kodi i artikullit është i detyrueshëm.");
      error.statusCode = 400;
      throw error;
    }
  }

  #parseId(id) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      const error = new Error("ID duhet të jetë numër i plotë pozitiv.");
      error.statusCode = 400;
      throw error;
    }

    return parsedId;
  }

  #toBoolean(value) {
    if (typeof value === "boolean") return value;
    return ["true", "1", "yes", "po"].includes(String(value).trim().toLowerCase());
  }
}

module.exports = StockItemService;
