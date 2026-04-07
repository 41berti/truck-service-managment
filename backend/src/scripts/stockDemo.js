const CsvStockItemRepository = require("../Data/repositories/CsvStockItemRepository");
const StockItemService = require("../Services/StockItemService");

async function runDemo() {
  const repository = new CsvStockItemRepository();
  const service = new StockItemService(repository);

  console.log("=== STOCK CRUD DEMO ===");

  const initialItems = await service.listo();
  console.log("Fillimisht në CSV:", initialItems.length, "artikuj");

  const created = await service.shto({
    item_code: "SC-AIR-200",
    name: "Air Filter Premium",
    category: "Engine",
    unit: "pcs",
    current_qty: 9,
    min_qty: 4,
    unit_cost: 27.5,
    supplier: "Scania Parts",
    location: "Shelf A2",
    is_active: true,
  });
  console.log("U shtua:", created);

  const found = await service.gjejSipasId(created.id);
  console.log("U gjet sipas ID:", found);

  const updated = await service.perditeso(created.id, {
    current_qty: 15,
    unit_cost: 29.9,
    location: "Shelf A3",
  });
  console.log("Pas update:", updated);

  const filtered = await service.listo({ category: "engine" });
  console.log("Filtrim sipas kategorisë 'engine':", filtered.length, "artikuj");

  const lowStockItems = await service.listo({ onlyLowStock: true });
  console.log("Artikuj low stock:", lowStockItems.length);

  const summary = await service.statistika();
  console.log("Statistikat:", summary);

  const deleted = await service.fshi(created.id);
  console.log(deleted.message);

  const finalItems = await service.listo();
  console.log("Në fund të demos:", finalItems.length, "artikuj");
}

runDemo().catch((error) => {
  console.error("Stock demo failed:", error.message);
});
