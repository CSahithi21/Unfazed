
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const appointmentRoutes = require("./routes/appointments");
const authRoutes = require("./routes/auth");
const selfCareRoutes = require("./routes/selfcare");
const profileRoutes = require("./routes/profile");
const availabilityRoutes = require("./routes/availability");
const waitlistRoutes = require("./routes/waitlist");
const clientsRoutes = require("./routes/clients");
const paymentRoutes = require("./routes/payments");
const sessionNotesRoutes = require("./routes/sessionNotes");
const messagesRoutes = require("./routes/messages");
const subscriptionRoutes = require("./routes/subscription");

const app = express();

app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return next(new Error("Invalid authentication token"));
        }

        socket.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    socket.join(`therapist:${socket.userId}`);

    console.log("Authenticated therapist connected:", socket.userId);

    socket.on("disconnect", () => {
        console.log("Therapist disconnected:", socket.userId);
    });
});

app.set("io", io);

// EXISTING API ROUTES
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/selfcare", selfCareRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/session-notes", sessionNotesRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/subscription", subscriptionRoutes);

// NEW SUBSCRIPTION ROUTE
app.use("/api/subscription", subscriptionRoutes);

app.get("/", (req, res) => {
    res.send("Unfazed Backend is Running!");
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log("Authenticated Socket.IO server is ready!");
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
    });
