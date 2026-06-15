const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      required: true,
    },

    meetingCode: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 8),
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },

    type: {
      type: String,
      enum: ["instant", "scheduled", "recurring"],
      default: "scheduled",
    },

    participants: [
      {
        type: String,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    duration: {
      type: Number,
      default: 0,
    },

    recording: {
      type: String,
      default: "",
    },

    transcript: [
      {
        speaker: String,
        text: String,
        timestamp: Date,
      },
    ],

    summary: {
      type: String,
      default: "",
    },

    actionItems: [
      {
        text: String,
        assignee: String,
        dueDate: Date,
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed"],
          default: "pending",
        },
      },
    ],

    maxParticipants: {
      type: Number,
      default: 50,
    },

    settings: {
      muteOnEntry: {
        type: Boolean,
        default: false,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      autoRecord: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

module.exports = Meeting;