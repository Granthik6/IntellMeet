const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { generateSummary, extractActionItems } = require("../controllers/aiController");

router.post("/summarize", authMiddleware, generateSummary);
router.post("/action-items", authMiddleware, extractActionItems);

module.exports = router;
