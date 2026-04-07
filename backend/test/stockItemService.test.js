const test = require("node:test");
const assert = require("node:assert/strict");

const StockItem = require("../src/Models/StockItem");
const StockItemService = require("../src/Services/StockItemService");

class InMemoryStockRepository {
  constructor(seedItems = []) {
    this.items = seedItems.map((item) => new StockItem(item));
  }

  async getAll() {
    return this.items.map((item) => new StockItem(item.toJSON()));
  }

  async getById(id) {
    const item = this.items.find((current) => current.id === Number(id));
    return item ? new StockItem(item.toJSON()) : null;
  }

  async add(entity) {
    const payload =
      entity instanceof StockItem ? entity.toJSON() : new StockItem(entity).toJSON();

    const nextId =
      this.items.length > 0
        ? Math.max(...this.items.map((item) => item.id)) + 1
        : 1;

    const created = new StockItem({
      ...payload,
      id: nextId,
      created_at: payload.created_at || "2026-04-07T08:30:00.000Z",
    });

    this.items.push(created);
    return new StockItem(created.toJSON());
  }
}

function createService() {
  return new StockItemService(
    new InMemoryStockRepository([
      {
        id: 1,
        item_code: "SC-FLT-001",
        name: "Oil Filter",
        category: "Engine",
        unit: "pcs",
        current_qty: 14,
        min_qty: 5,
        unit_cost: 10,
        supplier: "Scania Parts",
        location: "Shelf A1",
        is_active: true,
        created_at: "2026-04-01T08:00:00.000Z",
      },
      {
        id: 2,
        item_code: "SC-AIR-002",
        name: "Air Filter",
        category: "Engine",
        unit: "pcs",
        current_qty: 3,
        min_qty: 5,
        unit_cost: 20,
        supplier: "Scania Parts",
        location: "Shelf A2",
        is_active: true,
        created_at: "2026-04-02T08:00:00.000Z",
      },
      {
        id: 3,
        item_code: "SC-BRK-010",
        name: "Brake Pads Set",
        category: "Brakes",
        unit: "set",
        current_qty: 7,
        min_qty: 4,
        unit_cost: 25,
        supplier: "TruckParts KS",
        location: "Shelf B2",
        is_active: false,
        created_at: "2026-04-03T08:00:00.000Z",
      },
    ])
  );
}

test("listo filters stock items by search and sorts them by quantity descending", async () => {
  const service = createService();

  const items = await service.listo({
    search: "filter",
    category: "engine",
    sortBy: "current_qty",
    sortOrder: "desc",
  });

  assert.equal(items.length, 2);
  assert.deepEqual(
    items.map((item) => item.name),
    ["Oil Filter", "Air Filter"]
  );
});

test("listo returns only low-stock items when onlyLowStock is enabled", async () => {
  const service = createService();

  const items = await service.listo({ onlyLowStock: true });

  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Air Filter");
  assert.equal(items[0].is_low_stock, true);
});

test("statistika returns meaningful stock totals", async () => {
  const service = createService();

  const summary = await service.statistika();

  assert.deepEqual(summary, {
    total_items: 3,
    active_items: 2,
    low_stock_items: 1,
    total_inventory_value: 375,
  });
});

test("listo rejects an invalid sort field with status code 400", async () => {
  const service = createService();

  await assert.rejects(
    () => service.listo({ sortBy: "supplier_name" }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /sortBy/);
      return true;
    }
  );
});

test("gjejSipasId rejects a missing stock item with status code 404", async () => {
  const service = createService();

  await assert.rejects(
    () => service.gjejSipasId(999),
    (error) => {
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /nuk u gjet/i);
      return true;
    }
  );
});

test("shto rejects items with an empty name", async () => {
  const service = createService();

  await assert.rejects(
    () =>
      service.shto({
        item_code: "SC-NEW-001",
        name: "",
        category: "Engine",
        unit: "pcs",
        current_qty: 5,
        min_qty: 1,
        unit_cost: 15,
        supplier: "Scania Parts",
        location: "Shelf Z1",
      }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Emri i artikullit/);
      return true;
    }
  );
});
