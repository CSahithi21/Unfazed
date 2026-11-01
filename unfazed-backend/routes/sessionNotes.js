
const express = require("express");
const router = express.Router();

const SessionNote = require("../models/SessionNote");
const Client = require("../models/Client");
const auth = require("../middleware/auth");

router.use(auth);

// CREATE SESSION NOTE
router.post("/", async (req, res) => {
  try {
    const {
      clientId,
      sessionDate,
      noteType,
      subjective,
      objective,
      assessment,
      plan,
      isPrivate,
    } = req.body;

    const client = await Client.findOne({
      _id: clientId,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const note = await SessionNote.create({
      therapist: req.userId,
      client: client._id,
      sessionDate,
      noteType,
      subjective,
      objective,
      assessment,
      plan,
      isPrivate: isPrivate !== false,
    });

    res.status(201).json({
      message: "Session note saved successfully.",
      note,
    });
  } catch (error) {
    console.error("Session note creation error:", error);
    res.status(500).json({ message: "Could not save session note." });
  }
});

// GET SESSION NOTES
router.get("/", async (req, res) => {
  try {
    const notes = await SessionNote.find({
      therapist: req.userId,
    })
      .populate("client", "name email")
      .sort({ sessionDate: -1 });

    res.json(notes);
  } catch (error) {
    console.error("Session note fetch error:", error);
    res.status(500).json({ message: "Could not fetch session notes." });
  }
});

// EDIT SESSION NOTE
router.put("/:id", async (req, res) => {
  try {
    const note = await SessionNote.findOne({
      _id: req.params.id,
      therapist: req.userId,
    });

    if (!note) {
      return res.status(404).json({
        message: "Session note not found.",
      });
    }

    const {
      clientId,
      sessionDate,
      noteType,
      subjective,
      objective,
      assessment,
      plan,
      isPrivate,
    } = req.body;

    if (clientId) {
      const client = await Client.findOne({
        _id: clientId,
        therapist: req.userId,
      });

      if (!client) {
        return res.status(404).json({
          message: "Client not found.",
        });
      }

      note.client = client._id;
    }

    if (sessionDate !== undefined) note.sessionDate = sessionDate;

    if (noteType !== undefined) {
      if (!["SOAP", "DAP", "General"].includes(noteType)) {
        return res.status(400).json({
          message: "Invalid note type.",
        });
      }
      note.noteType = noteType;
    }

    if (subjective !== undefined) note.subjective = subjective;
    if (objective !== undefined) note.objective = objective;
    if (assessment !== undefined) note.assessment = assessment;
    if (plan !== undefined) note.plan = plan;

    if (isPrivate !== undefined) {
      note.isPrivate = isPrivate;
    }

    await note.save();

    res.json({
      message: "Session note updated successfully.",
      note,
    });
  } catch (error) {
    console.error("Session note update error:", error);
    res.status(500).json({
      message: "Could not update session note.",
    });
  }
});

// DELETE SESSION NOTE
router.delete("/:id", async (req, res) => {
  try {
    const note = await SessionNote.findOneAndDelete({
      _id: req.params.id,
      therapist: req.userId,
    });

    if (!note) {
      return res.status(404).json({
        message: "Session note not found.",
      });
    }

    res.json({
      message: "Session note deleted successfully.",
    });
  } catch (error) {
    console.error("Session note deletion error:", error);
    res.status(500).json({
      message: "Could not delete session note.",
    });
  }
});

module.exports = router;
