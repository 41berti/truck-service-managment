const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRoles = require("../middlewares/authorizeRoles");
const AppointmentService = require("../Services/AppointmentService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const appointmentService = new AppointmentService();

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getAll(req.query);

    return res.status(200).json({
      ok: true,
      count: appointments.length,
      appointments,
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const appointment = await appointmentService.create(req.body, req.user.id);

    return res.status(201).json({
      ok: true,
      message: "Appointment registered successfully",
      appointment,
    });
  })
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const appointment = await appointmentService.updateStatus(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      ok: true,
      message: "Appointment status updated successfully",
      appointment,
    });
  })
);

module.exports = router;
