const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const AuthService = require("../Services/AuthService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const authService = new AuthService();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  })
);

router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);

    return res.status(200).json({
      ok: true,
      user,
    });
  })
);

module.exports = router;
