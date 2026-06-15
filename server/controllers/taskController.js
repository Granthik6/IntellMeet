const Task = require("../models/Task");

// ================= CREATE TASK =================
const createTask = async (req, res) => {
  try {
    const { title, description, assignee, project, meeting, status, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      assignee: assignee || req.user.id,
      project,
      meeting,
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      createdBy: req.user.id,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar");

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
    const { status, priority, assignee, meeting, project } = req.query;
    const filter = {
      $or: [
        { createdBy: req.user.id },
        { assignee: req.user.id },
      ],
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (meeting) filter.meeting = meeting;
    if (project) filter.project = project;

    const tasks = await Task.find(filter)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("meeting", "title")
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
      .populate("meeting", "title");

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
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
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
