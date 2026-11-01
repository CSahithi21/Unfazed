
const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Create a unique public profile slug
async function createUniqueSlug(name) {
    let baseSlug = String(name || "therapist")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!baseSlug) baseSlug = "therapist";

    let slug = baseSlug;
    let count = 1;

    while (await User.exists({ slug })) {
        slug = `${baseSlug}-${count}`;
        count++;
    }

    return slug;
}

// Get logged-in therapist profile
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Therapist not found"
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: "Could not load profile"
        });
    }
});

// Update logged-in therapist profile
router.put("/me", auth, async (req, res) => {
    try {
        const { name, bio, specializations, languages } = req.body;

        if (
            (specializations !== undefined && !Array.isArray(specializations)) ||
            (languages !== undefined && !Array.isArray(languages))
        ) {
            return res.status(400).json({
                message: "Specializations and languages must be lists"
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "Therapist not found"
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Name cannot be empty"
                });
            }

            user.name = name.trim();
        }

        if (bio !== undefined) {
            if (typeof bio !== "string") {
                return res.status(400).json({
                    message: "Invalid bio"
                });
            }

            user.bio = bio.trim();
        }

        if (specializations !== undefined) {
            user.specializations = specializations;
        }

        if (languages !== undefined) {
            user.languages = languages;
        }

        // Generate a slug for older accounts that do not have one
        if (!user.slug) {
            user.slug = await createUniqueSlug(user.name);
        }

        await user.save();

        const safeUser = await User.findById(user._id).select("-password");

        res.json({
            message: "Profile updated successfully",
            user: safeUser
        });
    } catch (error) {
        console.error("Profile update error:", error.message);

        res.status(500).json({
            message: "Profile update failed"
        });
    }
});

// Public therapist profile
router.get("/:slug", async (req, res) => {
    try {
        const user = await User.findOne({
            slug: req.params.slug.toLowerCase()
        }).select("name slug bio specializations languages");

        if (!user) {
            return res.status(404).json({
                message: "Therapist profile not found"
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: "Could not load therapist profile"
        });
    }
});

module.exports = router;
