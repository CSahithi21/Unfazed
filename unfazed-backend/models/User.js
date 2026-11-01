
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        slug: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true
        },

        bio: {
            type: String,
            default: ""
        },

        specializations: {
            type: [String],
            default: []
        },

        languages: {
            type: [String],
            default: []
        },

        subscriptionPlan: {
            type: String,
            enum: ["free"],
            default: "free"
        },

        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },

        subscriptionStartDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
