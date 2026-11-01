
const express = require("express");
const router = express.Router();
const Waitlist = require("../models/Waitlist");

// Add a client to the waitlist
router.post("/", async (req, res) => {
  try {
    const { clientName, date, time } = req.body;

    if (!clientName || !date || !time) {
      return res.status(400).json({
        message: "Please provide name, date and time",
      });
    }

    const entry = await Waitlist.create({
      clientName,
      date,
      time,
    });

    res.status(201).json({
      message: "Successfully added to waitlist!",
      entry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not add to waitlist",
    });
  }
});

// View all waitlist entries
router.get("/", async (req, res) => {
  try {
    const entries = await Waitlist.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load waitlist",
    });
  }
});

module.exports = router;

