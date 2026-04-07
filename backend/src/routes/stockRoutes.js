const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");
const CsvStockItemRepository = require("../Data/repositories/CsvStockItemRepository");
const StockItemService = require("../Services/StockItemService");

const router = express.Router();
const stockService = new StockItemService(new CsvStockItemRepository());

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/summary", async (req, res) => {
  try {
    const summary = await stockService.statistika(req.query);

    return res.status(200).json({
      ok: true,
      message: "Përmbledhja e stokut u llogarit me sukses.",
      summary,
    });
  } catch (error) {
    console.error("Stock summary error:", error.message);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Nuk u arrit llogaritja e përmbledhjes së stokut.",
    });
  }
});

router.get("/low-stock", async (req, res) => {
  try {
    const items = await stockService.listo({
      ...req.query,
      onlyLowStock: true,
    });

    return res.status(200).json({
      ok: true,
      message:
        items.length > 0
          ? "Artikujt me stok të ulët u lexuan me sukses."
          : "Nuk ka artikuj me stok të ulët.",
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Low stock list error:", error.message);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Nuk u arrit leximi i artikujve me stok të ulët.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const items = await stockService.listo(req.query);

    return res.status(200).json({
      ok: true,
      message:
        items.length > 0
          ? "Artikujt e stokut u lexuan me sukses."
          : "Asnjë artikull nuk përputhet me filtrat e dhënë.",
      count: items.length,
      filters: {
        search: req.query.search ?? "",
        category: req.query.category ?? "",
        onlyLowStock: req.query.onlyLowStock ?? false,
        onlyActive: req.query.onlyActive ?? false,
        sortBy: req.query.sortBy ?? "id",
        sortOrder: req.query.sortOrder ?? "asc",
      },
      items,
    });
  } catch (error) {
    console.error("Stock list error:", error.message);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Nuk u arrit leximi i artikujve të stokut.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await stockService.gjejSipasId(req.params.id);

    return res.status(200).json({
      ok: true,
      message: "Artikulli u gjet me sukses.",
      item,
    });
  } catch (error) {
    console.error("Stock item error:", error.message);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Nuk u arrit leximi i artikullit.",
    });
  }
});

module.exports = router;
