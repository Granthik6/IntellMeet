const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    project: {
      type: String,
      default: "",
    },

    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "done", "completed"],
      default: "todo",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    dueDate: {
      type: Date,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
