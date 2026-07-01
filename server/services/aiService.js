const dotenv = require("dotenv");
dotenv.config();

/**
 * Transcribes audio recording buffer using OpenAI Whisper API.
 * @param {Buffer} fileBuffer
 * @returns {Promise<string>}
 */
const transcribeAudio = async (fileBuffer) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  try {
    const blob = new Blob([fileBuffer], { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Whisper transcription API failed");
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("❌ Whisper Transcription Error:", error.message);
    throw error;
  }
};

/**
 * Summarizes meeting transcript using Gemini or OpenAI.
 * @param {string} transcriptText
 * @returns {Promise<{ overview: string, keyPoints: string[] }>}
 */
const summarizeTranscript = async (transcriptText) => {
  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI meeting assistant. Summarize the following meeting transcript. Provide a response in JSON format matching this schema:
{
  "overview": "A clear, high-level summary of the meeting goals and outcomes (2-3 sentences).",
  "keyPoints": ["Key discussion point 1", "Key discussion point 2", "Key discussion point 3"]
}
Return ONLY valid JSON. Do not include markdown code block formatting (like \`\`\`json) or extra text.

Transcript:
${transcriptText}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini status code: ${response.status}`);
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(textResult.trim());
    } catch (error) {
      console.warn("⚠️ Gemini Summary failed, checking for OpenAI fallback:", error.message);
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `You are an AI meeting assistant. Summarize the following meeting transcript. Provide a response in JSON format matching this schema:
{
  "overview": "A clear, high-level summary of the meeting goals and outcomes (2-3 sentences).",
  "keyPoints": ["Key discussion point 1", "Key discussion point 2", "Key discussion point 3"]
}
Return ONLY valid JSON.

Transcript:
${transcriptText}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI status code: ${response.status}`);
      }

      const data = await response.json();
      const textResult = data.choices?.[0]?.message?.content;
      return JSON.parse(textResult.trim());
    } catch (error) {
      console.error("❌ OpenAI Summary failed:", error.message);
      throw error;
    }
  }

  throw new Error("No AI API Keys configured");
};

/**
 * Extracts action items using Gemini or OpenAI.
 * @param {string} transcriptText
 * @returns {Promise<Array<{ text: string, assignee: string, dueDate: string|null, priority: string }>>}
 */
const extractActionItems = async (transcriptText) => {
  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Extract action items from the following meeting transcript. For each action item, try to find who it is assigned to (the assignee) and estimate a due date if mentioned (otherwise leave it null). Assign a priority (low, medium, high, urgent). Return JSON format:
{
  "actionItems": [
    {
      "text": "Action item description",
      "assignee": "Name of person assigned or 'Unknown'",
      "dueDate": "ISO string date or null",
      "priority": "low | medium | high | urgent"
    }
  ]
}
Return ONLY valid JSON. Do not include markdown code block formatting (like \`\`\`json) or extra text.

Transcript:
${transcriptText}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini status code: ${response.status}`);
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(textResult.trim()).actionItems;
    } catch (error) {
      console.warn("⚠️ Gemini Action Items extraction failed, checking for OpenAI fallback:", error.message);
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Extract action items from the following meeting transcript. For each action item, find the assignee, estimate a due date if mentioned, and assign a priority (low, medium, high, urgent). Return JSON format:
{
  "actionItems": [
    {
      "text": "Action item description",
      "assignee": "Name of person assigned or 'Unknown'",
      "dueDate": "ISO string date or null",
      "priority": "low | medium | high | urgent"
    }
  ]
}
Return ONLY valid JSON.

Transcript:
${transcriptText}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI status code: ${response.status}`);
      }

      const data = await response.json();
      const textResult = data.choices?.[0]?.message?.content;
      return JSON.parse(textResult.trim()).actionItems;
    } catch (error) {
      console.error("❌ OpenAI Action Items extraction failed:", error.message);
      throw error;
    }
  }

  throw new Error("No AI API Keys configured");
};

module.exports = {
  transcribeAudio,
  summarizeTranscript,
  extractActionItems,
};
