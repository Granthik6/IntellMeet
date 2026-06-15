const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

// Config imports
const { initRedis, getRedisClient, isRedisAvailable } = require("./config/redis");
const { initPassport } = require("./config/passport");

// Route imports
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Model imports for socket notification creation
const Notification = require("./models/Notification");

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ==================== INITIALIZE SERVICES ====================

// Initialize Redis (with graceful fallback)
initRedis();

// Initialize Passport (Google OAuth)
initPassport();

// ==================== SOCKET CONNECTION ====================
const onlineUsers = {};
const meetingParticipants = {}; // Track participant states: { meetingId: { socketId: { name, muted, cameraOff } } }
const userSockets = {}; // Map userId -> socketId for notifications

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ── Register user for notifications ──
  socket.on("registerUser", ({ userId }) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId;
    }
  });

  // ── Join Room ──
  socket.on("joinRoom", ({ meetingId, sender }) => {
    socket.join(meetingId);

    if (!onlineUsers[meetingId]) {
      onlineUsers[meetingId] = [];
    }

    // Initialize participant state tracking for this meeting
    if (!meetingParticipants[meetingId]) {
      meetingParticipants[meetingId] = {};
    }

    // Avoid duplicates
    if (!onlineUsers[meetingId].find((user) => user.name === sender)) {
      onlineUsers[meetingId].push({
        name: sender,
        socketId: socket.id,
      });
    }

    // Track participant state (muted, camera, etc.)
    meetingParticipants[meetingId][socket.id] = {
      name: sender,
      socketId: socket.id,
      muted: false,
      cameraOff: false,
    };

    socket.emit("joinedRoom", {
      message: `Successfully joined ${meetingId}`,
    });

    // Send full participants list with states
    io.to(meetingId).emit(
      "participantsUpdate",
      onlineUsers[meetingId]
    );

    // Send current participant states to newly joined user
    socket.emit("participantStates", meetingParticipants[meetingId]);

    // Broadcast full state to everyone
    io.to(meetingId).emit("participantStatesUpdate", meetingParticipants[meetingId]);

    socket.to(meetingId).emit("systemMessage", {
      sender: "System",
      message: `${sender} joined the meeting`,
    });

    socket.meetingId = meetingId;
    socket.sender = sender;

    console.log(`👤 ${sender} joined room ${meetingId}`);
  });

  // ── Chat Messages ──
  socket.on("sendMessage", ({ meetingId, sender, message }) => {
    io.to(meetingId).emit("receiveMessage", {
      sender,
      message,
    });
  });

  // ── Typing Indicator ──
  socket.on("typing", ({ meetingId, sender }) => {
    socket.to(meetingId).emit("userTyping", sender);
  });

  // ── Audio/Video Status (shared mute state) ──
  socket.on("muteStatus", ({ meetingId, sender, muted }) => {
    // Update tracked state
    if (meetingParticipants[meetingId] && meetingParticipants[meetingId][socket.id]) {
      meetingParticipants[meetingId][socket.id].muted = muted;
    }

    // Broadcast to ALL participants (including sender) so everyone sees the state
    io.to(meetingId).emit("participantMuted", {
      sender,
      socketId: socket.id,
      muted,
    });

    // Broadcast full state update
    io.to(meetingId).emit("participantStatesUpdate", meetingParticipants[meetingId]);
  });

  socket.on("cameraStatus", ({ meetingId, sender, cameraOff }) => {
    // Update tracked state
    if (meetingParticipants[meetingId] && meetingParticipants[meetingId][socket.id]) {
      meetingParticipants[meetingId][socket.id].cameraOff = cameraOff;
    }

    // Broadcast to ALL participants
    io.to(meetingId).emit("participantCamera", {
      sender,
      socketId: socket.id,
      cameraOff,
    });

    // Broadcast full state update
    io.to(meetingId).emit("participantStatesUpdate", meetingParticipants[meetingId]);
  });

  // ── WebRTC Signaling ──
  socket.on("offer", ({ target, offer }) => {
    io.to(target).emit("offer", {
      offer,
      from: socket.id,
    });
  });

  socket.on("answer", ({ target, answer }) => {
    io.to(target).emit("answer", {
      answer,
      from: socket.id,
    });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  // ── Screen Sharing ──
  socket.on("screenShareStarted", ({ meetingId, sender }) => {
    socket.to(meetingId).emit("participantScreenShare", {
      sender,
      sharing: true,
    });
  });

  socket.on("screenShareStopped", ({ meetingId, sender }) => {
    socket.to(meetingId).emit("participantScreenShare", {
      sender,
      sharing: false,
    });
  });

  // ── Live Transcript ──
  socket.on("sendTranscript", ({ meetingId, speaker, text, timestamp }) => {
    io.to(meetingId).emit("receiveTranscript", {
      speaker,
      text,
      timestamp: timestamp || new Date().toISOString(),
    });
  });

  // ── Meeting Lifecycle ──
  socket.on("meetingStarted", ({ meetingId }) => {
    io.to(meetingId).emit("meetingStatus", { status: "active" });
  });

  socket.on("meetingEnded", ({ meetingId }) => {
    io.to(meetingId).emit("meetingStatus", { status: "completed" });
  });

  // ── Real-Time Notifications ──
  socket.on("sendNotification", async ({ userId, message }) => {
    try {
      // Save to database
      const notification = await Notification.create({
        user: userId,
        message,
      });

      // Send to user if online
      const targetSocketId = userSockets[userId];
      if (targetSocketId) {
        io.to(targetSocketId).emit("newNotification", {
          notification,
        });
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  });

  // ── Disconnect ──
  socket.on("disconnect", () => {
    if (socket.meetingId && socket.sender) {
      if (onlineUsers[socket.meetingId]) {
        onlineUsers[socket.meetingId] = onlineUsers[socket.meetingId].filter(
          (user) => user.name !== socket.sender
        );

        io.to(socket.meetingId).emit(
          "participantsUpdate",
          onlineUsers[socket.meetingId]
        );

        io.to(socket.meetingId).emit("systemMessage", {
          sender: "System",
          message: `${socket.sender} left the meeting`,
        });
      }

      // Clean up participant state tracking
      if (meetingParticipants[socket.meetingId]) {
        delete meetingParticipants[socket.meetingId][socket.id];
        io.to(socket.meetingId).emit("participantStatesUpdate", meetingParticipants[socket.meetingId]);

        // Clean up empty meeting entries
        if (Object.keys(meetingParticipants[socket.meetingId]).length === 0) {
          delete meetingParticipants[socket.meetingId];
        }
      }
    }

    // Remove from userSockets
    if (socket.userId) {
      delete userSockets[socket.userId];
    }

    console.log("❌ User disconnected:", socket.id);
  });
});

// ==================== MIDDLEWARE ====================

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: "Too many requests, please try again later." },
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Session middleware (for Passport OAuth fallback)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "intellmeet-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ==================== ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// ==================== MONGODB ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    status: "running",
    name: "IntellMeet Backend",
    version: "2.0",
    timestamp: new Date().toISOString(),
    redis: isRedisAvailable() ? "connected" : "unavailable (running without cache)",
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 IntellMeet Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
});