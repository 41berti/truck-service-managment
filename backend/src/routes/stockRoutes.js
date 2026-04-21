const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");
const CsvStockItemRepository = require("../Data/repositories/CsvStockItemRepository");
const StockItemService = require("../Services/StockItemService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const stockService = new StockItemService(new CsvStockItemRepository());

router.use(authenticateToken, authorizeRoles("ADMIN"));

const updateStockItem = asyncHandler(async (req, res) => {
  const item = await stockService.perditeso(req.params.id, req.body);

  return res.status(200).json({
    ok: true,
    message: "Artikulli u përditësua me sukses.",
    item,
  });
});

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await stockService.statistika(req.query);

    return res.status(200).json({
      ok: true,
      message: "Përmbledhja e stokut u llogarit me sukses.",
      summary,
    });
  })
);

router.get(
  "/low-stock",
  asyncHandler(async (req, res) => {
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
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
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
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const item = await stockService.shto(req.body);

    return res.status(201).json({
      ok: true,
      message: "Artikulli u shtua me sukses.",
      item,
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await stockService.gjejSipasId(req.params.id);

    return res.status(200).json({
      ok: true,
      message: "Artikulli u gjet me sukses.",
      item,
    });
  })
);

router.put("/:id", updateStockItem);
router.patch("/:id", updateStockItem);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await stockService.fshi(req.params.id);
    return res.status(200).json(result);
  })
);

module.exports = router;
