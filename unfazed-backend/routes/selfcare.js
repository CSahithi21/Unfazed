
const express = require("express");
const router = express.Router();
const SelfCare = require("../models/SelfCare");

router.get("/", async (req, res) => {
  try {
    let data = await SelfCare.findOne();

    if (!data) {
      data = await SelfCare.create({ tasks: [] });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || !tasks.every(task => typeof task === "string")) {
      return res.status(400).json({ message: "Invalid tasks." });
    }

    let data = await SelfCare.findOne();

    if (!data) {
      data = await SelfCare.create({ tasks });
    } else {
      data.tasks = tasks;
      data.updatedAt = new Date();
      await data.save();
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
