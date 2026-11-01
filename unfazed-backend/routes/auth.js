
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Generate a unique therapist profile slug
async function generateSlug(name) {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "therapist";

    let slug = baseSlug;
    let count = 1;

    while (await User.findOne({ slug })) {
        slug = `${baseSlug}-${count}`;
        count++;
    }

    return slug;
}

// Therapist Registration
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill in all fields"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const slug = await generateSlug(name);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            slug
        });

        return res.status(201).json({
            message: "Therapist registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                slug: user.slug,
                profileLink: `http://localhost:5173/${user.slug}`
            }
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
});

// Therapist Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter your email and password"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Server configuration error"
            });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                slug: user.slug
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Login failed"
        });
    }
});

module.exports = router;
