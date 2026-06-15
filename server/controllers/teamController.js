const Team = require("../models/Team");
const User = require("../models/User");

// ================= CREATE TEAM =================
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    const team = await Team.create({
      name,
      description,
      members: [{ user: req.user.id, role: "owner" }],
      createdBy: req.user.id,
    });

    // Add team to user's teams array
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { teams: team._id },
    });

    const populated = await Team.findById(team._id)
      .populate("members.user", "name email avatar status")
      .populate("createdBy", "name email avatar");

    res.status(201).json({
      message: "Team created successfully",
      team: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL TEAMS =================
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      "members.user": req.user.id,
    })
      .populate("members.user", "name email avatar status")
      .populate("createdBy", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET TEAM BY ID =================
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name email avatar status")
      .populate("createdBy", "name email avatar");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({ team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE TEAM =================
const updateTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    const team = await Team.findOneAndUpdate(
      {
        _id: req.params.id,
        "members.user": req.user.id,
      },
      { name, description },
      { new: true }
    )
      .populate("members.user", "name email avatar status")
      .populate("createdBy", "name email avatar");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE TEAM =================
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found or not authorized" });
    }

    // Remove team from all members' teams array
    const memberIds = team.members.map((m) => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { teams: team._id } }
    );

    res.status(200).json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADD MEMBER =================
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if already a member
    const isMember = team.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    team.members.push({ user: userToAdd._id, role: role || "member" });
    await team.save();

    // Add team to user's teams array
    await User.findByIdAndUpdate(userToAdd._id, {
      $addToSet: { teams: team._id },
    });

    const populated = await Team.findById(team._id)
      .populate("members.user", "name email avatar status")
      .populate("createdBy", "name email avatar");

    res.status(200).json({
      message: `${userToAdd.name} added to the team`,
      team: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= REMOVE MEMBER =================
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== userId
    );
    await team.save();

    // Remove team from user's teams array
    await User.findByIdAndUpdate(userId, {
      $pull: { teams: team._id },
    });

    const populated = await Team.findById(team._id)
      .populate("members.user", "name email avatar status")
      .populate("createdBy", "name email avatar");

    res.status(200).json({
      message: "Member removed from team",
      team: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
};
