const Meeting = require("../models/Meeting");
const { summarizeTranscript, extractActionItems: extractAIActionItems } = require("../services/aiService");

// ================= GENERATE SUMMARY =================
const generateSummary = async (req, res) => {
  try {
    const { meetingId, transcript } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    const fullText = transcript.map((t) => `${t.speaker || "Speaker"}: ${t.text}`).join("\n");
    let summary = null;

    if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        const aiSummary = await summarizeTranscript(fullText);
        const speakers = [...new Set(transcript.map((t) => t.speaker).filter(Boolean))];
        const duration = transcript.length > 0
          ? Math.round(
              (new Date(transcript[transcript.length - 1].timestamp) -
                new Date(transcript[0].timestamp)) /
                60000
            )
          : 0;

        summary = {
          overview: aiSummary.overview,
          keyPoints: aiSummary.keyPoints || [],
          participants: speakers,
          totalEntries: transcript.length,
          estimatedDuration: duration > 0 ? `${duration} minutes` : "N/A",
          generatedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.warn("⚠️ AI Summarization failed, falling back to heuristics:", error.message);
      }
    }

    // Heuristics Fallback
    if (!summary) {
      const combinedText = transcript.map((t) => t.text).join(". ");
      const sentences = combinedText
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      if (sentences.length === 0) {
        return res.status(400).json({ message: "Transcript too short to summarize" });
      }

      const wordFreq = {};
      const allWords = combinedText.toLowerCase().split(/\s+/);
      allWords.forEach((word) => {
        if (word.length > 3) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });

      const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        if (index < 3) score += 3 - index;
        if (index >= sentences.length - 2) score += 1;

        const words = sentence.toLowerCase().split(/\s+/);
        const freqScore = words.reduce((sum, word) => {
          return sum + (wordFreq[word] || 0);
        }, 0) / Math.max(words.length, 1);
        score += freqScore;

        if (words.length >= 5 && words.length <= 30) score += 2;
        if (words.length >= 10 && words.length <= 20) score += 1;

        const importantKeywords = [
          "decided", "agreed", "important", "action", "deadline",
          "priority", "milestone", "conclusion", "summary", "next",
          "plan", "strategy", "goal", "objective", "result",
          "update", "progress", "issue", "problem", "solution",
          "budget", "timeline", "review", "approve", "launch",
        ];
        importantKeywords.forEach((kw) => {
          if (sentence.toLowerCase().includes(kw)) score += 2;
        });

        return { sentence, score, index };
      });

      const numSentences = Math.min(Math.max(Math.ceil(sentences.length * 0.3), 3), 10);
      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences)
        .sort((a, b) => a.index - b.index)
        .map((s) => s.sentence);

      const speakers = [...new Set(transcript.map((t) => t.speaker).filter(Boolean))];
      const duration = transcript.length > 0
        ? Math.round(
            (new Date(transcript[transcript.length - 1].timestamp) -
              new Date(transcript[0].timestamp)) /
              60000
          )
        : 0;

      summary = {
        overview: topSentences.join(". ") + ".",
        keyPoints: topSentences.slice(0, 5),
        participants: speakers,
        totalEntries: transcript.length,
        estimatedDuration: duration > 0 ? `${duration} minutes` : "N/A",
        generatedAt: new Date().toISOString(),
      };
    }

    if (meetingId) {
      await Meeting.findByIdAndUpdate(meetingId, {
        summary: summary.overview,
        transcript: transcript,
      });
    }

    res.status(200).json({
      message: "Summary generated successfully",
      summary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= EXTRACT ACTION ITEMS =================
const extractActionItems = async (req, res) => {
  try {
    const { meetingId, transcript } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    let items = null;

    if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        const fullText = transcript.map((t) => `${t.speaker || "Speaker"}: ${t.text}`).join("\n");
        const aiActionItems = await extractAIActionItems(fullText);
        items = aiActionItems.map((item) => ({
          text: item.text,
          assignee: item.assignee || "Unknown",
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          status: "pending",
          priority: item.priority || "medium",
          source: "AI Extracted",
        }));
      } catch (error) {
        console.warn("⚠️ AI Action Items extraction failed, falling back to heuristics:", error.message);
      }
    }

    // Heuristics Fallback
    if (!items) {
      const actionPatterns = [
        /(\w+)\s+(should|needs? to|must|will|has to|is going to|shall)\s+(.+)/gi,
        /(please|let'?s|we need to|we should|i'?ll|we'?ll|make sure|ensure|follow up|schedule|create|set up|prepare|send|review|update|complete|finish|submit|deliver|organize|arrange|plan|implement|deploy|test|check|verify|fix|resolve)\s+(.+)/gi,
        /(by|before|until|due|deadline)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|end of day|end of week|eod|eow|\d{1,2}[\/\-]\d{1,2})/gi,
      ];

      const actionItems = [];
      const seen = new Set();

      transcript.forEach((entry) => {
        const text = entry.text || "";
        const speaker = entry.speaker || "Unknown";

        actionPatterns.forEach((pattern) => {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;

          while ((match = regex.exec(text)) !== null) {
            const actionText = match[0].trim();
            const normalized = actionText.toLowerCase().replace(/\s+/g, " ").substring(0, 100);
            if (seen.has(normalized) || actionText.length < 10) continue;
            seen.add(normalized);

            let assignee = speaker;
            const assigneeMatch = actionText.match(/(\w+)\s+(should|needs? to|must|will|has to)/i);
            if (assigneeMatch && assigneeMatch[1].toLowerCase() !== "we" && assigneeMatch[1].toLowerCase() !== "i") {
              assignee = assigneeMatch[1];
            }

            let dueDate = null;
            const dateMatch = actionText.match(
              /(by|before|until|due|deadline)\s+(monday|tuesday|wednesday|thursday|friday|tomorrow|next week|end of day|end of week|\d{1,2}[\/\-]\d{1,2})/i
            );
            if (dateMatch) {
              const dateHint = dateMatch[2].toLowerCase();
              const now = new Date();
              if (dateHint === "tomorrow") {
                dueDate = new Date(now.setDate(now.getDate() + 1));
              } else if (dateHint === "next week") {
                dueDate = new Date(now.setDate(now.getDate() + 7));
              } else if (dateHint === "end of day" || dateHint === "eod") {
                dueDate = new Date(now.setHours(23, 59, 59));
              } else if (dateHint === "end of week" || dateHint === "eow") {
                const daysToFri = (5 - now.getDay() + 7) % 7 || 7;
                dueDate = new Date(now.setDate(now.getDate() + daysToFri));
              }
            }

            let priority = "medium";
            if (/urgent|asap|critical|immediately|high priority/i.test(actionText)) {
              priority = "high";
            } else if (/low priority|when possible|nice to have|optional/i.test(actionText)) {
              priority = "low";
            }

            actionItems.push({
              text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
              assignee,
              dueDate,
              status: "pending",
              priority,
              source: `${speaker} said during meeting`,
            });
          }
        });
      });

      items = actionItems.slice(0, 20);
    }

    if (meetingId) {
      await Meeting.findByIdAndUpdate(meetingId, {
        actionItems: items.map((item) => ({
          text: item.text,
          assignee: item.assignee,
          dueDate: item.dueDate,
          status: item.status || "pending",
        })),
      });
    }

    res.status(200).json({
      message: "Action items extracted successfully",
      actionItems: items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateSummary,
  extractActionItems,
};
