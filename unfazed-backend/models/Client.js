
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    intakeNotes: {
      type: String,
      default: "",
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    consentDate: {
      type: Date,
      default: null,
    },
    intakeCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);
