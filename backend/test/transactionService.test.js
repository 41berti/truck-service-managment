process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/truck_service_test";

const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/db/pool");
const TransactionService = require("../src/Services/TransactionService");

test.after(async () => {
  await pool.end();
});

function mockPoolQuery(implementation) {
  const originalQuery = pool.query;
  pool.query = implementation;

  return function restore() {
    pool.query = originalQuery;
  };
}

test("create rejects unsupported transaction types", async () => {
  const service = new TransactionService();

  await assert.rejects(
    () =>
      service.create(
        "TRANSFER",
        {
          amount: 100,
          description: "Transfer",
          category: "Other",
          tx_date: "2026-04-10",
        },
        1
      ),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /INCOME or EXPENSE/i);
      return true;
    }
  );
});

test("create rejects impossible calendar dates", async () => {
  const service = new TransactionService();

  await assert.rejects(
    () =>
      service.create(
        "INCOME",
        {
          amount: 100,
          description: "Invoice payment",
          category: "Service",
          tx_date: "2026-02-30",
        },
        1
      ),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /valid date/i);
      return true;
    }
  );
});

test("getAll validates filters before querying the database", async () => {
  const service = new TransactionService();
  let queryCalled = false;

  const restore = mockPoolQuery(async () => {
    queryCalled = true;
    return { rows: [] };
  });

  try {
    await assert.rejects(
      () => service.getAll({ type: "refund" }),
      (error) => {
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /INCOME or EXPENSE/i);
        return true;
      }
    );

    assert.equal(queryCalled, false);
  } finally {
    restore();
  }
});

test("getAll returns mapped transactions and uses normalized filters", async () => {
  const service = new TransactionService();
  let capturedValues = [];

  const restore = mockPoolQuery(async (query, values) => {
    capturedValues = values;

    return {
      rows: [
        {
          id: 11,
          type: "INCOME",
          amount: "120.50",
          description: "Workshop payment",
          category: "Service",
          tx_date: "2026-04-05",
          created_by: 2,
          created_at: "2026-04-05T09:00:00.000Z",
        },
      ],
    };
  });

  try {
    const transactions = await service.getAll({
      type: "income",
      from: "2026-04-01",
      to: "2026-04-30",
    });

    assert.deepEqual(capturedValues, ["INCOME", "2026-04-01", "2026-04-30"]);
    assert.equal(transactions.length, 1);
    assert.equal(transactions[0].amount, 120.5);
    assert.equal(transactions[0].type, "INCOME");
  } finally {
    restore();
  }
});

test("getSummary rejects an inverted date range", async () => {
  const service = new TransactionService();

  await assert.rejects(
    () => service.getSummary({ from: "2026-04-30", to: "2026-04-01" }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /earlier than or equal/i);
      return true;
    }
  );
});
