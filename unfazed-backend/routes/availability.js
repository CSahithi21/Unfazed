
const express = require("express");
const Availability = require("../models/Availability");
const auth = require("../middleware/auth");

const router = express.Router();

// Get therapist availability
router.get("/", auth, async (req, res) => {
    try {
        const availability = await Availability.findOne({
            therapist: req.userId
        });

        res.json(availability || {
            workingDays: [],
            startTime: "09:00",
            endTime: "17:00",
            slotDuration: 30,
            timezone: "Asia/Kolkata"
        });
    } catch (error) {
        res.status(500).json({
            message: "Could not load availability"
        });
    }
});

// Save therapist availability
router.put("/", auth, async (req, res) => {
    try {
        const {
            workingDays,
            startTime,
            endTime,
            slotDuration,
            timezone
        } = req.body;

        const allowedDays = [
            "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday", "Sunday"
        ];

        if (
            !Array.isArray(workingDays) ||
            !workingDays.every(day => allowedDays.includes(day))
        ) {
            return res.status(400).json({
                message: "Please select valid working days"
            });
        }

        const validTime = time =>
            typeof time === "string" &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

        if (
            !validTime(startTime) ||
            !validTime(endTime) ||
            startTime >= endTime
        ) {
            return res.status(400).json({
                message: "Please enter a valid time range"
            });
        }

        if (
            !Number.isInteger(slotDuration) ||
            slotDuration < 15 ||
            slotDuration > 120
        ) {
            return res.status(400).json({
                message: "Slot duration must be between 15 and 120 minutes"
            });
        }

        const availability = await Availability.findOneAndUpdate(
            { therapist: req.userId },
            {
                $set: {
                    therapist: req.userId,
                    workingDays,
                    startTime,
                    endTime,
                    slotDuration,
                    timezone: timezone || "Asia/Kolkata"
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.json({
            message: "Availability saved successfully!",
            availability
        });
    } catch (error) {
        res.status(500).json({
            message: "Could not save availability"
        });
    }
});

module.exports = router;
