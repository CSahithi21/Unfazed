const mongoose = require("mongoose");

const selfCareSchema = new mongoose.Schema({
  tasks: {
    type: [String],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SelfCare", selfCareSchema);