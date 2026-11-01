
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");

// Require authentication for subscription details.
router.use(auth);

// GET /api/subscription
router.get("/", async (req, res) => {
    try {
        const user = await User.findById(req.userId).select(
            "subscriptionPlan subscriptionStatus subscriptionStartDate"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            plan: user.subscriptionPlan || "free",
            status: user.subscriptionStatus || "active",
            startDate: user.subscriptionStartDate || user.createdAt || null
        });
    } catch (error) {
        console.error("Subscription route error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to load subscription details."
        });
    }
});

// Return JSON if an unsupported subscription endpoint is requested.
router.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Subscription endpoint not found."
    });
});

module.exports = router;
