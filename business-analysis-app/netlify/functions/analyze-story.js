// business-analysis-app/netlify/functions/analyze-story.js

// Adjust the path to import from the new shared location
const { analyzeUserStory } = require('../../shared/userStoryAgent');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { story, acceptanceCriteria } = body;

    // The analyzeUserStory function already handles cases where 'story' might be empty or invalid,
    // returning a specific structured response. So, no need for an explicit check here
    // unless we want to return a 400 error for truly empty/malformed requests earlier.
    // For consistency with the prompt's agent behavior, we let analyzeUserStory handle it.

    if (story === undefined || story === null) {
        // If story is not even in the payload, it's a bad request.
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'story' in request body." }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    const analysisResult = analyzeUserStory(story, acceptanceCriteria || ""); // Pass empty string if AC is undefined

    return {
      statusCode: 200,
      body: JSON.stringify(analysisResult),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error("Error processing request:", error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
