const express = require('express');
const cors = require('cors');
// const { analyzeUserStory } = require('./userStoryAgent'); // Import the analyzer function - MOVED to netlify function & shared dir

const app = express();
const PORT = process.env.PORT || 3001; // Backend server will run on port 3001

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// Routes
app.get('/', (req, res) => {
  res.send('Business Analysis App Backend');
});

// Placeholder for User Story Analysis API endpoint
/*
// This route is now handled by Netlify Function: netlify/functions/analyze-story.js
app.post('/api/analyze-story', (req, res) => {
  const { story, acceptanceCriteria } = req.body;

  // The analyzeUserStory function handles empty story, so direct call is fine.
  // It expects acceptanceCriteria to be a string, potentially empty or multi-line.
  // const analysisResult = analyzeUserStory(story, acceptanceCriteria); // analyzeUserStory is no longer imported here

  // res.json(analysisResult);
  res.status(501).json({ message: "This endpoint is now served by a Netlify Function." });
});
*/

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
