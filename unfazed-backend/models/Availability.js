
const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
    {
        therapist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        workingDays: {
            type: [String],
            default: []
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },

        slotDuration: {
            type: Number,
            default: 30
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata"
        }
    },
    {
        timestamps: true
    }
);

availabilitySchema.index({ therapist: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema);
