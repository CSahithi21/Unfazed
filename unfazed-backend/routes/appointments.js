
const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
console.log("UNFAZED APPOINTMENT ROUTES LOADED");

// CREATE appointment
router.post("/", async (req, res) => {
  try {
    const { clientName, date, time } = req.body;

    const appointment = await Appointment.create({
      clientName,
      date,
      time,
    });

    res.status(201).json({
      message: "Appointment saved successfully!",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      date: 1,
      time: 1,
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
console.log("UPDATE ROUTE REGISTERED");

// UPDATE appointment
router.put("/:id", async (req, res) => {
  try {
    const { clientName, date, time } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { clientName, date, time },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.json({
      message: "Appointment updated successfully!",
      appointment,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE appointment
router.delete("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.json({
      message: "Appointment deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
