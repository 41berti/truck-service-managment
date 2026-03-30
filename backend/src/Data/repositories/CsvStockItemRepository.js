const fs = require("fs/promises");
const path = require("path");
const IRepository = require("./IRepository");
const StockItem = require("../../Models/StockItem");

class CsvStockItemRepository extends IRepository {
  #filePath;
  #items = [];
  #header =
    "id,item_code,name,category,unit,current_qty,min_qty,unit_cost,supplier,location,is_active,created_at";

  constructor(
    filePath = path.join(__dirname, "..", "sample-data", "stock-items.csv")
  ) {
    super();
    this.#filePath = filePath;
  }

  async #ensureFile() {
    await fs.mkdir(path.dirname(this.#filePath), { recursive: true });

    try {
      await fs.access(this.#filePath);
    } catch {
      await fs.writeFile(this.#filePath, this.#buildSeedFile(), "utf8");
    }
  }

  #buildSeedFile() {
    const seedItems = [
      {
        id: 1,
        item_code: "SC-FLT-001",
        name: "Oil Filter",
        category: "Engine",
        unit: "pcs",
        current_qty: 14,
        min_qty: 5,
        unit_cost: 18.5,
        supplier: "Scania Parts",
        location: "Shelf A1",
        is_active: true,
        created_at: "2026-03-24T08:00:00.000Z",
      },
      {
        id: 2,
        item_code: "SC-BRK-010",
        name: "Brake Pads Set",
        category: "Brakes",
        unit: "set",
        current_qty: 7,
        min_qty: 4,
        unit_cost: 95,
        supplier: "TruckParts KS",
        location: "Shelf B2",
        is_active: true,
        created_at: "2026-03-24T08:10:00.000Z",
      },
      {
        id: 3,
        item_code: "SC-ENG-021",
        name: "Coolant 5L",
        category: "Fluids",
        unit: "pcs",
        current_qty: 11,
        min_qty: 6,
        unit_cost: 22,
        supplier: "AutoFluid",
        location: "Shelf C1",
        is_active: true,
        created_at: "2026-03-24T08:20:00.000Z",
      },
      {
        id: 4,
        item_code: "SC-ELC-007",
        name: "Headlight Bulb",
        category: "Electrical",
        unit: "pcs",
        current_qty: 3,
        min_qty: 5,
        unit_cost: 12.75,
        supplier: "ElectroTruck",
        location: "Shelf D4",
        is_active: true,
        created_at: "2026-03-24T08:30:00.000Z",
      },
      {
        id: 5,
        item_code: "SC-TYR-099",
        name: "Wheel Nut",
        category: "Wheels",
        unit: "pcs",
        current_qty: 40,
        min_qty: 12,
        unit_cost: 3.2,
        supplier: "Fasteners Pro",
        location: "Bin E3",
        is_active: true,
        created_at: "2026-03-24T08:40:00.000Z",
      },
    ];

    const lines = seedItems.map((item) => this.#itemToCsvRow(item));
    return [this.#header, ...lines].join("\n") + "\n";
  }

  #escapeCsv(value) {
    const stringValue = String(value ?? "");
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  #parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values.map((value) => value.trim());
  }

  #toNumber(value, fallback = 0) {
    const normalized = String(value ?? "")
      .replace(/^\uFEFF/, "")
      .trim();

    if (normalized === "") {
      return fallback;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  #toBoolean(value) {
    return String(value).trim().toLowerCase() === "true";
  }

  #toStockItem(row) {
    const [
      rawId,
      item_code,
      name,
      category,
      unit,
      current_qty,
      min_qty,
      unit_cost,
      supplier,
      location,
      is_active,
      created_at,
    ] = this.#parseCsvLine(row);

    const id = this.#toNumber(rawId, NaN);

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return new StockItem({
      id,
      item_code,
      name,
      category,
      unit,
      current_qty: this.#toNumber(current_qty, 0),
      min_qty: this.#toNumber(min_qty, 0),
      unit_cost: this.#toNumber(unit_cost, 0),
      supplier,
      location,
      is_active: this.#toBoolean(is_active),
      created_at: created_at || new Date().toISOString(),
    });
  }

  #itemToCsvRow(item) {
    const row =
      item instanceof StockItem ? item.toJSON() : new StockItem(item).toJSON();

    return [
      this.#escapeCsv(row.id),
      this.#escapeCsv(row.item_code),
      this.#escapeCsv(row.name),
      this.#escapeCsv(row.category),
      this.#escapeCsv(row.unit),
      this.#escapeCsv(row.current_qty),
      this.#escapeCsv(row.min_qty),
      this.#escapeCsv(row.unit_cost),
      this.#escapeCsv(row.supplier),
      this.#escapeCsv(row.location),
      this.#escapeCsv(row.is_active),
      this.#escapeCsv(row.created_at),
    ].join(",");
  }

  async getAll() {
    await this.#ensureFile();
    const raw = await fs.readFile(this.#filePath, "utf8");
    const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length <= 1) {
      this.#items = [];
      return [];
    }

    this.#items = lines
      .slice(1)
      .map((line) => this.#toStockItem(line))
      .filter((item) => item !== null);

    return [...this.#items].sort((a, b) => a.id - b.id);
  }

  #getNextId(items) {
    const validIds = items
      .map((item) => Number(item.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    return validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
  }

  async getById(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    const items = await this.getAll();
    return items.find((item) => item.id === numericId) || null;
  }

  async add(entity) {
    const items = await this.getAll();
    const nextId = this.#getNextId(items);

    const stockItem =
      entity instanceof StockItem
        ? new StockItem({
            ...entity.toJSON(),
            id: nextId,
            created_at: entity.created_at || new Date().toISOString(),
          })
        : new StockItem({
            ...entity,
            id: nextId,
            created_at: entity.created_at || new Date().toISOString(),
          });

    items.push(stockItem);
    this.#items = items;
    await this.save();

    return stockItem;
  }

  async update(id, updatedFields) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    const items = await this.getAll();
    const index = items.findIndex((item) => item.id === numericId);

    if (index === -1) {
      return null;
    }

    const current = items[index].toJSON();
    const updated = new StockItem({
      ...current,
      ...updatedFields,
      id: current.id,
      created_at: current.created_at,
    });

    items[index] = updated;
    this.#items = items;
    await this.save();

    return updated;
  }

  async delete(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return false;
    }

    const items = await this.getAll();
    const filtered = items.filter((item) => item.id !== numericId);

    if (filtered.length === items.length) {
      return false;
    }

    this.#items = filtered;
    await this.save();

    return true;
  }

  async save() {
    await this.#ensureFile();

    const lines = this.#items
      .filter((item) => Number.isInteger(Number(item.id)) && Number(item.id) > 0)
      .sort((a, b) => a.id - b.id)
      .map((item) => this.#itemToCsvRow(item));

    const content = [this.#header, ...lines].join("\n") + "\n";
    await fs.writeFile(this.#filePath, content, "utf8");
  }
}

module.exports = CsvStockItemRepository;