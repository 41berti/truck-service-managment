const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");
const AttendanceService = require("../Services/AttendanceService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const attendanceService = new AttendanceService();

router.use(authenticateToken, authorizeRoles("ADMIN", "MECHANIC", "GUARD"));

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const allUsers = await attendanceService.listUsers();
    const users =
      req.user.role === "ADMIN"
        ? allUsers
        : allUsers.filter((user) => Number(user.id) === Number(req.user.id));

    return res.status(200).json({
      ok: true,
      count: users.length,
      users,
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const records = await attendanceService.getAll({
      ...req.query,
      user_id: req.user.role === "ADMIN" ? req.query.user_id : req.user.id,
    });

    return res.status(200).json({
      ok: true,
      count: records.length,
      records,
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const record = await attendanceService.create({
      ...req.body,
      user_id: req.user.role === "ADMIN" ? req.body.user_id : req.user.id,
    });

    return res.status(201).json({
      ok: true,
      message: "Attendance record created successfully",
      record,
    });
  })
);

router.patch(
  "/:id/check-out",
  asyncHandler(async (req, res) => {
    const record = await attendanceService.checkOut(req.params.id, req.body, req.user);

    return res.status(200).json({
      ok: true,
      message: "Attendance check-out saved successfully",
      record,
    });
  })
);

router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const record = await attendanceService.update(req.params.id, req.body);

    return res.status(200).json({
      ok: true,
      message: "Attendance record updated successfully",
      record,
    });
  })
);

router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await attendanceService.delete(req.params.id);

    return res.status(200).json(result);
  })
);

module.exports = router;
