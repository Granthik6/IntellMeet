const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../config/multer");
const authMiddleware = require("../middleware/authMiddleware");

const {
  signup,
  login,
  refreshTokenHandler,
  logout,
  getProfile,
  updateProfile,
  googleCallback,
  getUsers,
} = require("../controllers/authController");

// Public routes
router.post("/signup", upload.single("avatar"), signup);
router.post("/login", login);
router.post("/refresh-token", refreshTokenHandler);

// Protected routes
router.post("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, upload.single("avatar"), updateProfile);
router.get("/users", authMiddleware, getUsers);

// Google OAuth routes (only active when credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/login",
    }),
    googleCallback
  );
} else {
  router.get("/google", (req, res) => {
    res.status(501).json({
      message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
    });
  });
  router.get("/google/callback", (req, res) => {
    res.status(501).json({ message: "Google OAuth is not configured." });
  });
}

module.exports = router;