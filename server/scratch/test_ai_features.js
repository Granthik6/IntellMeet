/**
 * Verification Test Script: AI Summary and Action Item Extraction Accuracy
 * 
 * This script runs the IntellMeet summarization and action item extraction algorithms
 * on a predefined meeting transcript dataset and evaluates accuracy metrics.
 */

const { generateSummary, extractActionItems } = require("../controllers/aiController");

// Mock Express request/response helpers
const createMockReqRes = (body) => {
  const req = { body };
  let responseData = {};
  let statusCode = 200;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return { req, res, getResult: () => ({ status: statusCode, data: responseData }) };
};

// 1. Mock meeting transcript dialogue
const sampleTranscript = [
  { speaker: "John", text: "Welcome everyone to our weekly sync. Let's start with project updates.", timestamp: new Date() },
  { speaker: "Alice", text: "Sure, the frontend is looking good, but we need to finish the dashboard mockups. I will complete the mockup design by tomorrow.", timestamp: new Date() },
  { speaker: "John", text: "Great. Bob, what is the status of the database migration?", timestamp: new Date() },
  { speaker: "Bob", text: "I have started the migration. I should finish it by Friday. Also, John needs to review the security policy.", timestamp: new Date() },
  { speaker: "John", text: "Agreed. I will review that before end of day. Let's make sure the timeline is on track.", timestamp: new Date() },
  { speaker: "Alice", text: "Excellent. We also need to deploy the staging server by next week.", timestamp: new Date() },
  { speaker: "John", text: "Sounds like a plan. Let's wrap up this meeting.", timestamp: new Date() }
];

// Expected Action Items for evaluation
const expectedActionItems = [
  { text: "mockup", assignee: "Alice", dueRelative: "tomorrow" },
  { text: "migration", assignee: "Bob", dueRelative: "Friday" },
  { text: "security policy", assignee: "John", dueRelative: "end of day" },
  { text: "staging server", assignee: "Alice", dueRelative: "next week" }
];

async function runEvaluation() {
  console.log("====================================================");
  console.log("📊 IntellMeet AI Heuristics & Summary Evaluation");
  console.log("====================================================\n");

  // A. Evaluate Summarization
  console.log("🔄 Generating Summary...");
  const summaryContext = createMockReqRes({ transcript: sampleTranscript });
  await generateSummary(summaryContext.req, summaryContext.res);
  const summaryResult = summaryContext.getResult();

  if (summaryResult.status === 200) {
    const summary = summaryResult.data.summary;
    console.log("✅ Summary Generated Successfully!");
    console.log("📝 Overview:", summary.overview);
    console.log("📌 Key Points extracted:", summary.keyPoints.length);
    summary.keyPoints.forEach((p, idx) => console.log(`   ${idx + 1}. ${p}`));
    console.log(`⏱️ Estimated duration: ${summary.estimatedDuration}\n`);
  } else {
    console.error("❌ Summary Generation failed:", summaryResult.data.message);
  }

  // B. Evaluate Action Items Extraction
  console.log("🔄 Extracting Action Items...");
  const actionContext = createMockReqRes({ transcript: sampleTranscript });
  await extractActionItems(actionContext.req, actionContext.res);
  const actionResult = actionContext.getResult();

  if (actionResult.status === 200) {
    const items = actionResult.data.actionItems;
    console.log("✅ Action Items Extracted Successfully!");
    console.log(`📦 Found ${items.length} items:\n`);
    items.forEach((item, idx) => {
      console.log(`   ${idx + 1}. [${item.priority.toUpperCase()}] ${item.text}`);
      console.log(`      Assignee: ${item.assignee} | Due: ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}`);
    });
    console.log("");

    // Calculate Precision / Recall metrics
    let truePositives = 0;
    
    expectedActionItems.forEach((expected) => {
      const matched = items.find((extracted) => {
        const textMatch = extracted.text.toLowerCase().includes(expected.text.toLowerCase());
        const assigneeMatch = extracted.assignee.toLowerCase() === expected.assignee.toLowerCase();
        return textMatch && assigneeMatch;
      });

      if (matched) {
        truePositives++;
      }
    });

    const precision = items.length > 0 ? (truePositives / items.length) : 0;
    const recall = expectedActionItems.length > 0 ? (truePositives / expectedActionItems.length) : 0;
    const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    console.log("====================================================");
    console.log("📈 Accuracy Metrics");
    console.log("====================================================");
    console.log(`🎯 Expected Action Items: ${expectedActionItems.length}`);
    console.log(`🔍 Extracted Action Items: ${items.length}`);
    console.log(`✅ Correctly Matched (True Positives): ${truePositives}`);
    console.log(`📊 Precision (extracted and correct): ${(precision * 100).toFixed(1)}%`);
    console.log(`📊 Recall (total expected found): ${(recall * 100).toFixed(1)}%`);
    console.log(`📊 F1 Score (overall quality): ${(f1 * 100).toFixed(1)}%`);
    console.log("====================================================\n");
  } else {
    console.error("❌ Action Items extraction failed:", actionResult.data.message);
  }
}

runEvaluation();
