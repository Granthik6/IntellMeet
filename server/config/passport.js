const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const initPassport = () => {
  // Only configure Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              return done(null, user);
            }

            // Check if email already exists (local account)
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // Link Google account to existing local account
              user.googleId = profile.id;
              user.provider = "google";
              if (!user.avatar && profile.photos && profile.photos[0]) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }

            // Create new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              provider: "google",
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
            });

            done(null, user);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );

    console.log("✅ Google OAuth configured");
  } else {
    console.log("⚠️  Google OAuth: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET, skipping");
  }

  // Serialize/Deserialize (for session fallback)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = { initPassport };
