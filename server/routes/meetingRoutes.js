const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/roleMiddleware");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const {
  createMeeting,
  getMeetings,
  getMeetingById,
  getMeetingByCode,
  updateMeeting,
  updateMeetingStatus,
  addTranscript,
  uploadRecording,
  deleteMeeting,
} = require("../controllers/meetingController");

// Meeting CRUD with caching
router.post("/create", authMiddleware, createMeeting);
router.get("/", authMiddleware, cacheMiddleware("meetings", 120), getMeetings);
router.get("/code/:code", authMiddleware, getMeetingByCode);
router.get("/:id", authMiddleware, cacheMiddleware("meeting", 120), getMeetingById);
router.put("/:id", authMiddleware, updateMeeting);
router.put("/:id/status", authMiddleware, updateMeetingStatus);
router.post("/:id/transcript", authMiddleware, addTranscript);

// Recording upload (uses memory storage for Cloudinary stream upload)
router.post("/:id/recording", authMiddleware, uploadMiddleware.single("recording"), uploadRecording);

// Admin-only: delete meeting
router.delete("/:id", authMiddleware, adminMiddleware, deleteMeeting);

module.exports = router;