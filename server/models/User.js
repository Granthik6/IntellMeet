const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    avatar: {
      type: String,
      default: "",
    },

    refreshToken: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["Admin", "Member"],
      default: "Member",
    },

    // OAuth2 fields
    googleId: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    bio: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["online", "away", "busy", "offline"],
      default: "offline",
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },

    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    settings: {
      notifications: {
        type: Boolean,
        default: true,
      },
      darkMode: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;