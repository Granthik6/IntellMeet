/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role(s)
 */

// Generic role checker — accepts an array of allowed roles
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        message: "Access denied. No role assigned.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// Convenience middleware for Admin-only routes
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};

// Convenience middleware for Member+ routes (both Admin and Member)
const memberMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (!["Admin", "Member"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Access denied. Membership required.",
    });
  }

  next();
};

module.exports = {
  roleMiddleware,
  adminMiddleware,
  memberMiddleware,
};
