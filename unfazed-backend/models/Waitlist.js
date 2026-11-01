
const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "notified", "booked"],
      default: "waiting",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Waitlist", waitlistSchema);
