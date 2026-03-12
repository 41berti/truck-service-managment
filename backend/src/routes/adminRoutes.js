const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

/*
  GET /admin/dashboard
  Only ADMIN can access
*/
router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      ok: true,
      message: "Welcome to the admin dashboard",
      user: req.user,
    });
  }
);

module.exports = router;