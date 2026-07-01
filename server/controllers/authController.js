const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const crypto = require("crypto");

// Helper: Generate access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Helper: Generate refresh token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh",
    { expiresIn: "7d" }
  );
};

// ================= SIGNUP =================
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: req.file ? req.file.path : "",
      provider: "local",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user using email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // Check if user registered via OAuth
    if (user.provider !== "local") {
      return res.status(400).json({
        message: `This account uses ${user.provider} sign-in. Please use that method.`,
      });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // Update last active
    user.lastActive = new Date();
    user.status = "online";

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB (token rotation)
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= REFRESH TOKEN =================
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh"
      );
    } catch {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    // Find user and validate stored refresh token
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      // Token reuse detected — invalidate all tokens
      if (user) {
        user.refreshToken = "";
        await user.save();
      }
      return res.status(401).json({
        message: "Invalid refresh token. Please login again.",
      });
    }

    // Token rotation: generate new pair
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Store new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= LOGOUT =================
const logout = async (req, res) => {
  try {
    // Clear refresh token from DB
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = "";
      user.status = "offline";
      await user.save();
    }

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET PROFILE =================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        department: user.department,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE PROFILE (with avatar) =================
const updateProfile = async (req, res) => {
  try {
    const { name, email, bio, department } = req.body;
    const updateData = { name, email, bio, department };

    // Handle avatar upload if file provided
    if (req.file) {
      updateData.avatar = req.file.path; // Cloudinary URL from multer-storage-cloudinary
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GOOGLE OAUTH CALLBACK =================
const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    user.lastActive = new Date();
    user.status = "online";
    await user.save();

    // Redirect to frontend with tokens
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(
      `${clientUrl}/login?token=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`
    );
  } catch (error) {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
};

// ================= GET ALL USERS =================
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("name email avatar _id status");
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login,
  refreshTokenHandler,
  logout,
  getProfile,
  updateProfile,
  googleCallback,
  getUsers,
};