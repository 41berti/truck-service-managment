require("dotenv").config();

const PostgresStockItemRepository = require("../Data/repositories/PostgresStockItemRepository");
const pool = require("../db/pool");

async function syncStockToPostgres() {
  const repository = new PostgresStockItemRepository();
  const items = await repository.getAll();

  console.log(`Stock sync complete. PostgreSQL now has ${items.length} stock items.`);
}

syncStockToPostgres()
  .catch((error) => {
    console.error("Stock sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
