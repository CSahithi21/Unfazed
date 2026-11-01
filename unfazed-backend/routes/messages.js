
const express = require("express");
const router = express.Router();

const Message = require("../models/Message");
const Client = require("../models/Client");
const auth = require("../middleware/auth");

router.use(auth);

// SEND DEMONSTRATION MESSAGE
router.post("/", async (req, res) => {
  try {
    const { clientId, message } = req.body;

    if (!clientId || !message || !message.trim()) {
      return res.status(400).json({
        message: "Client and message are required.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        message: "Message cannot exceed 2000 characters.",
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    const newMessage = await Message.create({
      sender: req.userId,
      receiver: client._id,
      message: message.trim(),
    });

    // SEND REAL-TIME NOTIFICATION TO THE AUTHENTICATED THERAPIST
    const io = req.app.get("io");

    if (io) {
      io.to(`therapist:${req.userId}`).emit("new_message", {
        clientId: client._id.toString(),
        message: {
          _id: newMessage._id,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
        },
      });
    }

    res.status(201).json({
      message: "Demonstration message saved successfully.",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Could not send message.",
    });
  }
});

// GET MESSAGES FOR A CLIENT
router.get("/:clientId", async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.clientId,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    const messages = await Message.find({
      sender: req.userId,
      receiver: client._id,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);

    res.status(500).json({
      message: "Could not fetch messages.",
    });
  }
});

module.exports = router;
