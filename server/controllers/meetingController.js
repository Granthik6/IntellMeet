const Meeting = require("../models/Meeting");
const cloudinary = require("../config/cloudinary");
const { cacheDel } = require("../config/redis");
const { Readable } = require("stream");

// Helper: Invalidate meeting caches
const invalidateMeetingCache = async (userId) => {
  await cacheDel("meetings:*");
  if (userId) {
    await cacheDel(`meeting:${userId}:*`);
  }
};

// Create Meeting
const createMeeting = async (req, res) => {
  try {
    const { title, description, date, participants, type, settings } = req.body;

    const meeting = await Meeting.create({
      title,
      description,
      date,
      participants,
      type: type || "scheduled",
      settings,
      createdBy: req.user.id,
    });

    // Invalidate cache
    await invalidateMeetingCache(req.user.id);

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Meetings of Logged-in User
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { createdBy: req.user.id },
        { participants: req.user.name },
        { participants: req.user.id },
      ],
    }).sort({ date: -1 });

    res.status(200).json({ meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Meeting
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.status === "cancelled") {
      return res.status(400).json({ message: "This meeting has been cancelled by the host" });
    }

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Meeting by Code
const getMeetingByCode = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingCode: req.params.code,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found with this code" });
    }

    if (meeting.status === "cancelled") {
      return res.status(400).json({ message: "This meeting has been cancelled by the host" });
    }

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Meeting
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Invalidate cache
    await invalidateMeetingCache(req.user.id);

    res.status(200).json({
      message: "Meeting updated successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Meeting Status
const updateMeetingStatus = async (req, res) => {
  try {
    const { status, duration } = req.body;

    const updateData = { status };
    if (duration !== undefined) updateData.duration = duration;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Invalidate cache
    await invalidateMeetingCache(req.user.id);

    res.status(200).json({
      message: "Meeting status updated",
      meeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Transcript Entry
const addTranscript = async (req, res) => {
  try {
    const { speaker, text, timestamp } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          transcript: { speaker, text, timestamp: timestamp || new Date() },
        },
      },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json({
      message: "Transcript added",
      transcript: meeting.transcript,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Recording to Cloudinary
const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No recording file provided" });
    }

    // Upload to Cloudinary as video
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "intellmeet/recordings",
          resource_type: "video",
          format: "webm",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to readable stream
      const readableStream = new Readable();
      readableStream.push(req.file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    // Transcribe the video recording buffer if Whisper is available
    let transcribedText = "";
    if (process.env.OPENAI_API_KEY) {
      try {
        const { transcribeAudio } = require("../services/aiService");
        transcribedText = await transcribeAudio(req.file.buffer);
      } catch (err) {
        console.warn("⚠️ Whisper automatic recording transcription failed:", err.message);
      }
    }

    // Update meeting with recording URL
    const updateData = { recording: uploadResult.secure_url };
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (transcribedText) {
      meeting.transcript.push({
        speaker: "Meeting Recording (AI)",
        text: transcribedText,
        timestamp: new Date(),
      });
      await meeting.save();
    } else {
      await Meeting.findByIdAndUpdate(req.params.id, updateData);
    }

    const updatedMeeting = await Meeting.findById(req.params.id);

    // Invalidate cache
    await invalidateMeetingCache(req.user.id);

    res.status(200).json({
      message: transcribedText 
        ? "Recording uploaded and transcribed successfully" 
        : "Recording uploaded successfully",
      recording: uploadResult.secure_url,
      meeting: updatedMeeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Meeting
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Allow deletion if the user is the creator OR is an admin
    if (meeting.createdBy && meeting.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to delete this meeting" });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    // Invalidate cache
    await invalidateMeetingCache(req.user.id);

    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  getMeetingByCode,
  updateMeeting,
  updateMeetingStatus,
  addTranscript,
  uploadRecording,
  deleteMeeting,
};