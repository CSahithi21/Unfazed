
const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
    noteType: {
      type: String,
      enum: ["SOAP", "DAP", "General"],
      default: "SOAP",
    },
    subjective: {
      type: String,
      default: "",
    },
    objective: {
      type: String,
      default: "",
    },
    assessment: {
      type: String,
      default: "",
    },
    plan: {
      type: String,
      default: "",
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SessionNote", sessionNoteSchema);
