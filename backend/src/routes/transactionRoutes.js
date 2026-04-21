const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");
const TransactionService = require("../Services/TransactionService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const transactionService = new TransactionService();

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.post(
  "/income",
  asyncHandler(async (req, res) => {
    const transaction = await transactionService.create(
      "INCOME",
      req.body,
      req.user.id
    );

    return res.status(201).json({
      ok: true,
      message: "Income transaction created successfully",
      transaction,
    });
  })
);

router.post(
  "/expense",
  asyncHandler(async (req, res) => {
    const transaction = await transactionService.create(
      "EXPENSE",
      req.body,
      req.user.id
    );

    return res.status(201).json({
      ok: true,
      message: "Expense transaction created successfully",
      transaction,
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const transactions = await transactionService.getAll(req.query);

    return res.status(200).json({
      ok: true,
      count: transactions.length,
      transactions,
    });
  })
);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await transactionService.getSummary(req.query);

    return res.status(200).json({
      ok: true,
      summary,
    });
  })
);

module.exports = router;
