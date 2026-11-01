
const express = require("express");
const router = express.Router();

const Client = require("../models/Client");
const auth = require("../middleware/auth");

router.use(auth);

// ADD CLIENT
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      intakeNotes,
      consentGiven,
      intakeCompleted,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Client name is required",
      });
    }

    const consent = consentGiven === true;

    const client = await Client.create({
      therapist: req.userId,
      name: name.trim(),
      email,
      phone,
      consentGiven: consent,
      consentDate: consent ? new Date() : null,
      intakeNotes: consent ? intakeNotes || "" : "",
      intakeCompleted: consent && intakeCompleted === true,
    });

    res.status(201).json({
      message: "Client added successfully",
      client,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not add client",
    });
  }
});

// GET ALL CLIENTS
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find({
      therapist: req.userId,
    }).sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch clients",
    });
  }
});

// GET ONE CLIENT
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    res.json(client);
  } catch (error) {
    res.status(400).json({
      message: "Invalid client ID",
    });
  }
});

// UPDATE CLIENT
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      intakeNotes,
      consentGiven,
      intakeCompleted,
    } = req.body;

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({
        message: "Client name cannot be empty",
      });
    }

    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    if (name !== undefined) client.name = name.trim();
    if (email !== undefined) client.email = email;
    if (phone !== undefined) client.phone = phone;

    if (consentGiven === false) {
      client.consentGiven = false;
      client.consentDate = null;
      client.intakeNotes = "";
      client.intakeCompleted = false;
    } else if (consentGiven === true) {
      if (!client.consentGiven) {
        client.consentDate = new Date();
      }

      client.consentGiven = true;

      if (intakeNotes !== undefined) {
        client.intakeNotes = intakeNotes;
      }

      if (intakeCompleted !== undefined) {
        client.intakeCompleted = intakeCompleted === true;
      }
    } else {
      if (intakeNotes !== undefined && client.consentGiven) {
        client.intakeNotes = intakeNotes;
      }

      if (intakeCompleted !== undefined && client.consentGiven) {
        client.intakeCompleted = intakeCompleted === true;
      }
    }

    await client.save();

    res.json({
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not update client",
    });
  }
});

// DELETE CLIENT
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    res.json({
      message: "Client deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not delete client",
    });
  }
});

module.exports = router;
