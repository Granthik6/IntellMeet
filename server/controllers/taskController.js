const Task = require("../models/Task");

// ================= CREATE TASK =================
const createTask = async (req, res) => {
  try {
    const { title, description, assignee, project, meeting, status, priority, dueDate, team } = req.body;

    const task = await Task.create({
      title,
      description,
      assignee: assignee || req.user.id,
      project,
      meeting,
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      team,
      createdBy: req.user.id,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar");

    // Notification trigger for assignee
    if (assignee && assignee.toString() !== req.user.id.toString()) {
      try {
        const Notification = require("../models/Notification");
        const notification = await Notification.create({
          user: assignee,
          message: `New task assigned: "${title}" by ${req.user.name}`,
        });

        const io = req.app.get("io");
        if (io) {
          io.to(`user:${assignee}`).emit("newNotification", { notification });
        }
      } catch (err) {
        console.error("❌ Task creation notification failed:", err.message);
      }
    }

    res.status(201).json({
      message: "Task created successfully",
      task: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL TASKS =================
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, meeting, project, team } = req.query;

    // Find all teams this user belongs to
    const Team = require("../models/Team");
    const userTeams = await Team.find({ "members.user": req.user.id });
    const teamIds = userTeams.map((t) => t._id);

    const filter = {
      $or: [
        { createdBy: req.user.id },
        { assignee: req.user.id },
        { team: { $in: teamIds } },
      ],
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (meeting) filter.meeting = meeting;
    if (project) filter.project = project;
    if (team) filter.team = team;

    const tasks = await Task.find(filter)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("meeting", "title")
      .populate("team", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET TASK BY ID =================
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("meeting", "title")
      .populate("team", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE TASK =================
const updateTask = async (req, res) => {
  try {
    const originalTask = await Task.findById(req.params.id);
    if (!originalTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar");

    // Notification check: if assignee changed and isn't the modifier
    if (
      req.body.assignee &&
      (!originalTask.assignee || originalTask.assignee.toString() !== req.body.assignee.toString()) &&
      req.body.assignee.toString() !== req.user.id.toString()
    ) {
      try {
        const Notification = require("../models/Notification");
        const notification = await Notification.create({
          user: req.body.assignee,
          message: `Task "${task.title}" has been assigned to you by ${req.user.name}`,
        });

        const io = req.app.get("io");
        if (io) {
          io.to(`user:${req.body.assignee}`).emit("newNotification", { notification });
        }
      } catch (err) {
        console.error("❌ Task assignment notification failed:", err.message);
      }
    }

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE TASK =================
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      $or: [{ createdBy: req.user.id }, { assignee: req.user.id }],
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
