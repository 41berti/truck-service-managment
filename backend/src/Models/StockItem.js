class StockItem {
  #id;
  #itemCode;
  #name;
  #category;
  #unit;
  #currentQty;
  #minQty;
  #unitCost;
  #supplier;
  #location;
  #isActive;
  #createdAt;

  constructor({
    id,
    item_code,
    name,
    category,
    unit,
    current_qty,
    min_qty,
    unit_cost,
    supplier,
    location,
    is_active = true,
    created_at = null,
  }) {
    this.#id = Number(id);
    this.#itemCode = item_code ?? "";
    this.#name = name ?? "";
    this.#category = category ?? "";
    this.#unit = unit ?? "";
    this.#currentQty = Number(current_qty ?? 0);
    this.#minQty = Number(min_qty ?? 0);
    this.#unitCost = Number(unit_cost ?? 0);
    this.#supplier = supplier ?? "";
    this.#location = location ?? "";
    this.#isActive = this.#toBoolean(is_active);
    this.#createdAt = created_at ?? null;
  }

  #toBoolean(value) {
    if (typeof value === "boolean") return value;
    return ["true", "1", "yes", "po"].includes(String(value).trim().toLowerCase());
  }

  get id() {
    return this.#id;
  }

  get itemCode() {
    return this.#itemCode;
  }

  get name() {
    return this.#name;
  }

  get category() {
    return this.#category;
  }

  get unit() {
    return this.#unit;
  }

  get currentQty() {
    return this.#currentQty;
  }

  get minQty() {
    return this.#minQty;
  }

  get unitCost() {
    return this.#unitCost;
  }

  get supplier() {
    return this.#supplier;
  }

  get location() {
    return this.#location;
  }

  get isActive() {
    return this.#isActive;
  }

  get isLowStock() {
    return this.#currentQty <= this.#minQty;
  }

  toJSON() {
    return {
      id: this.#id,
      item_code: this.#itemCode,
      name: this.#name,
      category: this.#category,
      unit: this.#unit,
      current_qty: this.#currentQty,
      min_qty: this.#minQty,
      unit_cost: this.#unitCost,
      supplier: this.#supplier,
      location: this.#location,
      is_active: this.#isActive,
      created_at: this.#createdAt,
      is_low_stock: this.isLowStock,
    };
  }
}

module.exports = StockItem;
