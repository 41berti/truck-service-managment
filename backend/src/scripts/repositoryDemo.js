const CsvTransactionRepository = require("../Data/repositories/CsvTransactionRepository");

async function runDemo() {
  const repository = new CsvTransactionRepository();

  await repository.add({
    id: Date.now(),
    type: "INCOME",
    amount: 250,
    description: "CSV repository demo transaction",
    category: "Demo",
    tx_date: "2026-03-19",
    created_by: 1,
  });

  const allTransactions = await repository.getAll();

  console.log("Repository demo successful.");
  console.log("Total CSV transactions:", allTransactions.length);
  console.log(allTransactions.map((t) => t.toJSON()));
}

runDemo().catch((error) => {
  console.error("Repository demo failed:", error);
});