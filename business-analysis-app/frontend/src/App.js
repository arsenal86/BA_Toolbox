import React, { useState } from 'react';
import './App.css'; // We'll create this for basic styling

function App() {
  const [story, setStory] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Updated API endpoint for Netlify Functions
      const response = await fetch('/.netlify/functions/analyze-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ story, acceptanceCriteria }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderScore = (score, maxScore) => `${score} / ${maxScore}`;

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const {
      overallReadinessScore,
      clarityAndRequirementAnalysis,
      investCriteriaAssessment,
      outstandingQueriesAndConflicts,
      actionableRecommendations
    } = analysisResult;

    return (
      <div className="analysis-results">
        <h2>Analysis Result</h2>

        <div className="result-section">
          <h3>Overall Readiness Score</h3>
          <p><strong>Readiness Rating:</strong> {overallReadinessScore.readinessRating}%</p>
          <p><strong>Readiness Category:</strong> {overallReadinessScore.readinessCategory}</p>
          <p><strong>Summary:</strong> {overallReadinessScore.summary}</p>
          <p><strong>Score Breakdown:</strong></p>
          <ul>
            <li>Clarity & Requirement Analysis: {renderScore(overallReadinessScore.scoreBreakdown.clarityRequirementAnalysis, 40)}</li>
            <li>INVEST Criteria Assessment: {renderScore(overallReadinessScore.scoreBreakdown.investCriteriaAssessment, 60)}</li>
          </ul>
        </div>

        <div className="result-section">
          <h3>Clarity and Requirement Analysis ({renderScore(clarityAndRequirementAnalysis.totalScore, 40)})</h3>
          <p><strong>Format Check ({renderScore(clarityAndRequirementAnalysis.formatCheck.score, 10)}):</strong> {clarityAndRequirementAnalysis.formatCheck.feedback}</p>
          <p><strong>Clarity & Ambiguity ({renderScore(clarityAndRequirementAnalysis.clarityAmbiguity.score, 15)}):</strong> {clarityAndRequirementAnalysis.clarityAmbiguity.feedback}</p>
          <p><strong>Acceptance Criteria ({renderScore(clarityAndRequirementAnalysis.acceptanceCriteria.score, 15)}):</strong> {clarityAndRequirementAnalysis.acceptanceCriteria.feedback}</p>
        </div>

        <div className="result-section">
          <h3>INVEST Criteria Assessment ({renderScore(investCriteriaAssessment.totalScore, 60)})</h3>
          <ul>
            <li><strong>Independent ({renderScore(investCriteriaAssessment.independent.score, 10)}):</strong> {investCriteriaAssessment.independent.justification}</li>
            <li><strong>Negotiable ({renderScore(investCriteriaAssessment.negotiable.score, 10)}):</strong> {investCriteriaAssessment.negotiable.justification}</li>
            <li><strong>Valuable ({renderScore(investCriteriaAssessment.valuable.score, 10)}):</strong> {investCriteriaAssessment.valuable.justification}</li>
            <li><strong>Estimable ({renderScore(investCriteriaAssessment.estimable.score, 10)}):</strong> {investCriteriaAssessment.estimable.justification}</li>
            <li><strong>Small ({renderScore(investCriteriaAssessment.small.score, 10)}):</strong> {investCriteriaAssessment.small.justification}</li>
            <li><strong>Testable ({renderScore(investCriteriaAssessment.testable.score, 10)}):</strong> {investCriteriaAssessment.testable.justification}</li>
          </ul>
        </div>

        {outstandingQueriesAndConflicts && outstandingQueriesAndConflicts.length > 0 && (
          <div className="result-section">
            <h3>Outstanding Queries & Conflicts</h3>
            <ul>
              {outstandingQueriesAndConflicts.map((query, index) => (
                <li key={index}>{query}</li>
              ))}
            </ul>
          </div>
        )}

        {actionableRecommendations && (
          <div className="result-section">
            <h3>Actionable Recommendations</h3>
            <p><strong>Suggested Improvements:</strong></p>
            <pre>{actionableRecommendations.suggestedImprovements}</pre>
            {actionableRecommendations.storyDecomposition && actionableRecommendations.storyDecomposition.length > 0 && (
              <>
                <p><strong>Story Decomposition:</strong></p>
                <ul>
                  {actionableRecommendations.storyDecomposition.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>User Story Analysis Agent</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit} className="story-form">
          <div className="form-group">
            <label htmlFor="userStory">User Story:</label>
            <textarea
              id="userStory"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="As a [persona], I want [goal], so that [value]"
              rows="4"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="acceptanceCriteria">Acceptance Criteria (optional, one per line):</label>
            <textarea
              id="acceptanceCriteria"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              placeholder="Given [context] When [action] Then [outcome]&#x0a;Verify that..."
              rows="6"
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Story'}
          </button>
        </form>

        {error && <p className="error-message">Error: {error}</p>}

        {renderAnalysisResult()}
      </main>
      <footer className="App-footer">
        <p>Business Analysis Web App</p>
      </footer>
    </div>
  );
}

export default App;
