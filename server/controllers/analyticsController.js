const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");

// ================= GET ANALYTICS =================
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total meetings created by or involving user
    const meetings = await Meeting.find({
      $or: [{ createdBy: userId }, { participants: { $exists: true } }],
    });

    const userMeetings = meetings.filter(
      (m) =>
        m.createdBy?.toString() === userId ||
        m.participants?.includes(userId)
    );

    const totalMeetings = userMeetings.length;
    const now = new Date();
    const upcomingMeetings = userMeetings.filter((m) => new Date(m.date) >= now).length;
    const completedMeetings = userMeetings.filter((m) => new Date(m.date) < now).length;

    // Average participants
    const totalParticipants = userMeetings.reduce(
      (sum, m) => sum + (m.participants?.length || 0),
      0
    );
    const avgParticipants = totalMeetings > 0 ? Math.round(totalParticipants / totalMeetings) : 0;

    // Average duration
    const durationsArr = userMeetings.filter((m) => m.duration > 0).map((m) => m.duration);
    const avgDuration = durationsArr.length > 0
      ? Math.round(durationsArr.reduce((a, b) => a + b, 0) / durationsArr.length)
      : 0;

    // Action items count
    const allActionItems = userMeetings.reduce(
      (sum, m) => sum + (m.actionItems?.length || 0),
      0
    );

    // Meetings per month (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();

      const count = userMeetings.filter((m) => {
        const md = new Date(m.date);
        return md.getMonth() === month && md.getFullYear() === year;
      }).length;

      monthlyData.push({
        label: monthNames[month],
        month: month + 1,
        year,
        count,
      });
    }

    // Tasks summary
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignee: userId }],
    });

    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === "todo").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    // Teams count
    const teamsCount = await Team.countDocuments({
      "members.user": userId,
    });

    // Meetings with AI summaries
    const meetingsWithSummary = userMeetings.filter((m) => m.summary && m.summary.length > 0).length;

    res.status(200).json({
      totalMeetings,
      upcomingMeetings,
      completedMeetings,
      avgParticipants,
      avgDuration,
      allActionItems,
      monthlyData,
      tasksByStatus,
      totalTasks: tasks.length,
      teamsCount,
      meetingsWithSummary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
};
