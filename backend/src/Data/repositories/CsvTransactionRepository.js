const fs = require("fs/promises");
const path = require("path");
const IRepository = require("./IRepository");
const Transaction = require("../../Models/Transaction");

class CsvTransactionRepository extends IRepository {
  #filePath;
  #items = [];

  constructor(
    filePath = path.join(__dirname, "..", "sample-data", "transactions.csv")
  ) {
    super();
    this.#filePath = filePath;
  }

  async #ensureFile() {
    await fs.mkdir(path.dirname(this.#filePath), { recursive: true });

    try {
      await fs.access(this.#filePath);
    } catch {
      await fs.writeFile(
        this.#filePath,
        "id,type,amount,description,category,tx_date,created_by\n",
        "utf8"
      );
    }
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
    return values;
  }

  async getAll() {
    await this.#ensureFile();
    const raw = await fs.readFile(this.#filePath, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);

    if (lines.length <= 1) {
      this.#items = [];
      return [];
    }

    const rows = lines.slice(1).map((line) => {
      const [id, type, amount, description, category, tx_date, created_by] =
        this.#parseCsvLine(line);

      return new Transaction({
        id: Number(id),
        type,
        amount: Number(amount),
        description,
        category,
        tx_date,
        created_by: Number(created_by),
      });
    });

    this.#items = rows;
    return rows;
  }

  async getById(id) {
    const items = await this.getAll();
    return items.find((item) => String(item.id) === String(id)) || null;
  }

  async add(entity) {
    const items = await this.getAll();
    const transaction =
      entity instanceof Transaction ? entity : new Transaction(entity);

    items.push(transaction);
    this.#items = items;
    await this.save();

    return transaction;
  }

  async update(id, updatedFields) {
    const items = await this.getAll();
    const index = items.findIndex((item) => String(item.id) === String(id));

    if (index === -1) {
      return null;
    }

    const current = items[index].toJSON();
    items[index] = new Transaction({
      ...current,
      ...updatedFields,
      id: current.id,
    });

    this.#items = items;
    await this.save();
    return items[index];
  }

  async delete(id) {
    const items = await this.getAll();
    const filtered = items.filter((item) => String(item.id) !== String(id));

    if (filtered.length === items.length) {
      return false;
    }

    this.#items = filtered;
    await this.save();
    return true;
  }

  async save() {
    await this.#ensureFile();

    const header = "id,type,amount,description,category,tx_date,created_by";
    const lines = this.#items.map((item) => {
      const row = item.toJSON();
      return [
        this.#escapeCsv(row.id),
        this.#escapeCsv(row.type),
        this.#escapeCsv(row.amount),
        this.#escapeCsv(row.description),
        this.#escapeCsv(row.category),
        this.#escapeCsv(row.tx_date),
        this.#escapeCsv(row.created_by),
      ].join(",");
    });

    const content = [header, ...lines].join("\n") + "\n";
    await fs.writeFile(this.#filePath, content, "utf8");
  }
}

module.exports = CsvTransactionRepository;
