/**
 * @fileoverview An AI agent that analyzes user stories, provides coaching feedback,
 * and generates a structured report based on Agile best practices.
 * @version 3.0.0
 */

// =================================================================
// CONFIGURATION
// =================================================================
const CONFIG = {
    STORY_FORMAT_REGEX: /As an? (.*), I want (.*), so that (.*)/i,
    THRESHOLDS: {
        SHORT_STORY_LENGTH: 25,
        LONG_STORY_LENGTH: 200,
        MAX_ACCEPTANCE_CRITERIA: 7,
    },
    KEYWORDS: {
        AMBIGUOUS: ["should", "could", "might", "etc.", "and/or"],
        DEPENDENCIES: ["dependent on", "after", "following", "once"],
        TECHNICAL: ["database", "api endpoint", "react component", "algorithm", "sql"],
        TESTABLE_AC: ["verify that", "ensure that", "given", "when", "then", "confirm that"],
    },
    SCORING: {
        // Clarity & Requirement Analysis (Max: 40)
        FORMAT_SUCCESS: 10,
        FORMAT_FAIL: 2,
        CLARITY_BASE: 10,
        CLARITY_BONUS_CONCISE: 5,
        CLARITY_BONUS_SPECIFIC: 5,
        AC_PROVIDED: 15,
        AC_EMPTY: 5,
        AC_MISSING: 0,
        AC_NON_TESTABLE_DEDUCTION: 5,
        // INVEST Criteria (Max: 60, 10 per category)
        INVEST_DEFAULT_HIGH: 8,
        INVEST_DEFAULT_MEDIUM: 6,
        INVEST_DEFAULT_LOW: 3,
    },
    READINESS_CATEGORIES: [
        { score: 90, label: "✅ Excellent – Ready for Development", summary: "Story is well-formed, clear, and meets all INVEST criteria." },
        { score: 71, label: "⚠️ At Standard Expected – Minor Refinement Needed", summary: "Mostly ready with small gaps that can be addressed quickly." },
        { score: 50, label: "❗ Requires Improvement – Needs Refinement", summary: "Multiple issues present. Not ready for development without rework." },
        { score: 0,  label: "🚫 Not Ready – Fundamentally Incomplete", summary: "Lacks essential components. Requires major revision." },
    ]
};

// =================================================================
// HELPER & INFERENCE FUNCTIONS
// =================================================================

/**
 * Gets the readiness category based on a percentage score.
 * @param {number} score - The overall percentage score (0-100).
 * @returns {{label: string, summary: string}}
 */
function getReadinessCategory(score) {
    return CONFIG.READINESS_CATEGORIES.find(cat => score >= cat.score);
}

/**
 * Analyzes acceptance criteria text.
 * @param {string} acceptanceCriteriaText
 * @returns {{criteria: string[], testableKeywordsFound: boolean, nonTestableCount: number}}
 */
function analyzeAcceptanceCriteria(acceptanceCriteriaText) {
    if (!acceptanceCriteriaText || acceptanceCriteriaText.trim() === '') {
        return { criteria: [], testableKeywordsFound: false, nonTestableCount: 0 };
    }
    const criteria = acceptanceCriteriaText.split('\n').filter(c => c.trim() !== '');
    let nonTestableCount = 0;
    let testableKeywordsFound = false;

    criteria.forEach(c => {
        const isTestable = CONFIG.KEYWORDS.TESTABLE_AC.some(kw => c.toLowerCase().includes(kw));
        if (!isTestable) nonTestableCount++;
        else testableKeywordsFound = true;
    });

    return { criteria, testableKeywordsFound, nonTestableCount };
}

/**
 * Infers sample acceptance criteria when none are provided.
 * @param {string[]} formatMatch - The result of matching the story against STORY_FORMAT_REGEX.
 * @returns {string[]} An array of inferred acceptance criteria strings.
 */
function inferAcceptanceCriteria(formatMatch) {
    if (!formatMatch || !formatMatch[2]) return [];
    const goal = formatMatch[2];
    return [
        `Given the user is on the relevant page, when they attempt to ${goal}, then the expected outcome occurs.`,
        `Given the user provides invalid input for '${goal}', when they submit, then a clear error message is displayed.`,
        `Verify that the action to '${goal}' is logged for analytics.`
    ];
}

/**
 * Suggests how a large story could be decomposed into smaller stories.
 * @param {string[]} formatMatch - The result of matching the story against STORY_FORMAT_REGEX.
 * @returns {string[]} An array of smaller, suggested user story strings.
 */
function suggestDecomposition(formatMatch) {
    if (!formatMatch) return [];
    const [_, persona, goal, value] = formatMatch;
    // This is a simple heuristic. A more advanced agent could use NLP to find sub-goals.
    if (goal.toLowerCase().includes("manage")) {
        return [
            `As a ${persona}, I want to create a new item, so that ${value}.`,
            `As a ${persona}, I want to edit an existing item, so that ${value}.`,
            `As a ${persona}, I want to delete an item, so that ${value}.`
        ];
    }
    return ["Consider splitting the story by individual acceptance criteria or steps in the user workflow. Each new story should still provide value."];
}


// =================================================================
// CORE ANALYSIS FUNCTIONS
// =================================================================

/**
 * Analyzes the story for format, clarity, and acceptance criteria.
 * @param {string} story - The user story text.
 * @param {string} acceptanceCriteriaText - The acceptance criteria text.
 * @returns {object} A detailed analysis of clarity and requirements.
 */
function analyzeClarityAndRequirement(story, acceptanceCriteriaText) {
    const formatMatch = story.match(CONFIG.STORY_FORMAT_REGEX);
    const formatScore = formatMatch ? CONFIG.SCORING.FORMAT_SUCCESS : CONFIG.SCORING.FORMAT_FAIL;
    const formatFeedback = formatMatch ?
        "Story follows the standard 'As a [persona], I want [goal], so that [value]' format." :
        "Story does not strictly follow the 'As a [persona], I want [goal], so that [value]' format. This helps ensure role, action, and benefit are clear.";

    // Clarity & Ambiguity
    let clarityScore = CONFIG.SCORING.CLARITY_BASE;
    let clarityFeedbackItems = [];
    if (story.length < CONFIG.THRESHOLDS.SHORT_STORY_LENGTH) {
        clarityFeedbackItems.push("Story seems very short, ensure it's sufficiently detailed.");
    } else {
        clarityScore += CONFIG.SCORING.CLARITY_BONUS_CONCISE;
    }

    const hasAmbiguousTerms = CONFIG.KEYWORDS.AMBIGUOUS.some(term => story.toLowerCase().includes(term));
    if (hasAmbiguousTerms) {
        clarityFeedbackItems.push("Avoid ambiguous terms like 'should', 'could', or 'might'. Be specific.");
    } else {
        clarityScore += CONFIG.SCORING.CLARITY_BONUS_SPECIFIC;
    }
    const clarityFinalScore = Math.min(15, clarityScore); // Cap score at 15
    const clarityFinalFeedback = clarityFeedbackItems.length > 0 ? clarityFeedbackItems.join(" ") : "Language appears reasonably clear.";

    // Acceptance Criteria
    const acAnalysis = analyzeAcceptanceCriteria(acceptanceCriteriaText);
    let acScore = CONFIG.SCORING.AC_MISSING;
    let acFeedback = "Acceptance criteria are missing. Clear, testable ACs are essential. Consider using the 'Given/When/Then' format.";

    if (acceptanceCriteriaText) {
        if (acAnalysis.criteria.length > 0) {
            acScore = CONFIG.SCORING.AC_PROVIDED;
            acFeedback = `Acceptance criteria provided (${acAnalysis.criteria.length} criteria found). Ensure they are specific and testable.`;
            if (acAnalysis.nonTestableCount > acAnalysis.criteria.length / 2) {
                acScore -= CONFIG.SCORING.AC_NON_TESTABLE_DEDUCTION;
                acFeedback += " Some ACs may not be easily testable; consider phrasing with keywords like 'Verify that...'.";
            }
        } else {
            acScore = CONFIG.SCORING.AC_EMPTY;
            acFeedback = "Acceptance criteria section is present but empty. Please define clear, testable acceptance criteria.";
        }
    }

    return {
        total: formatScore + clarityFinalScore + acScore,
        formatCheck: { score: formatScore, feedback: formatFeedback },
        clarityAmbiguity: { score: clarityFinalScore, feedback: clarityFinalFeedback },
        acceptanceCriteria: { score: acScore, feedback: acFeedback },
        formatMatch // Pass the match result for use in other functions
    };
}

/**
 * Assesses the story against the INVEST criteria.
 * @param {string} story - The user story text.
 * @param {object} clarityAnalysis - The results from the clarity analysis.
 * @param {string} acceptanceCriteriaText - The acceptance criteria text.
 * @returns {object} A detailed analysis of each INVEST principle.
 */
function analyzeINVEST(story, clarityAnalysis, acceptanceCriteriaText) {
    const acAnalysis = analyzeAcceptanceCriteria(acceptanceCriteriaText);

    const hasDependencyKeywords = CONFIG.KEYWORDS.DEPENDENCIES.some(term => story.toLowerCase().includes(term));
    const independent = {
        score: hasDependencyKeywords ? CONFIG.SCORING.INVEST_DEFAULT_LOW : CONFIG.SCORING.INVEST_DEFAULT_MEDIUM,
        justification: hasDependencyKeywords ? "Story may have dependencies based on keywords ('after', 'dependent on', etc.). Clarify if it can be worked on without external blockers." : "Assumed to be developable independently. It's good practice to review for hidden dependencies with the team."
    };

    const hasTechnicalTerms = CONFIG.KEYWORDS.TECHNICAL.some(term => story.toLowerCase().includes(term));
    const negotiable = {
        score: hasTechnicalTerms ? CONFIG.SCORING.INVEST_DEFAULT_LOW : CONFIG.SCORING.INVEST_DEFAULT_HIGH,
        justification: hasTechnicalTerms ? "Story might be too prescriptive with technical details (e.g., 'database', 'api endpoint'). It's better to focus on user needs and let the team decide on the 'how'." : "Story seems to describe 'what' not 'how', which is great. This allows for discussion on the best implementation."
    };

    const hasClearValue = clarityAnalysis.formatMatch && clarityAnalysis.formatMatch[3] && clarityAnalysis.formatMatch[3].trim().length > 5;
    const valuable = {
        score: hasClearValue ? 10 : CONFIG.SCORING.INVEST_DEFAULT_LOW,
        justification: hasClearValue ? `Value proposition seems clear: '${clarityAnalysis.formatMatch[3]}'.` : "The 'so that [value]' part of the story is missing or unclear. It's crucial to state the benefit to the user or business to justify the work."
    };

    const isEstimable = acAnalysis.criteria.length > 0 && story.length > CONFIG.THRESHOLDS.SHORT_STORY_LENGTH;
    const estimable = {
        score: isEstimable ? CONFIG.SCORING.INVEST_DEFAULT_HIGH : CONFIG.SCORING.INVEST_DEFAULT_MEDIUM,
        justification: isEstimable ? "With a clear goal and acceptance criteria, the team should be able to estimate this story." : "The story or its acceptance criteria may be too vague or missing, which makes estimation difficult. Providing more detail will help."
    };

    const isLarge = story.length > CONFIG.THRESHOLDS.LONG_STORY_LENGTH || acAnalysis.criteria.length > CONFIG.THRESHOLDS.MAX_ACCEPTANCE_CRITERIA;
    const small = {
        score: isLarge ? CONFIG.SCORING.INVEST_DEFAULT_LOW : CONFIG.SCORING.INVEST_DEFAULT_HIGH,
        justification: isLarge ? "The story or its number of acceptance criteria seems large. This might be an 'epic' that should be broken down into smaller, valuable pieces to fit within a sprint." : "Story appears to be a reasonable size and should be completable within a single sprint."
    };

    let testableScore = CONFIG.SCORING.INVEST_DEFAULT_LOW;
    let testableJustification = "Testability cannot be assessed without clear acceptance criteria. A story isn't 'done' if it can't be tested.";
    if (acAnalysis.criteria.length > 0) {
        testableScore = acAnalysis.testableKeywordsFound ? CONFIG.SCORING.INVEST_DEFAULT_HIGH : CONFIG.SCORING.INVEST_DEFAULT_MEDIUM;
        testableJustification = "Acceptance criteria are provided. To be highly testable, they should be unambiguous and allow for clear pass/fail conditions.";
        if (acAnalysis.nonTestableCount > 0) {
            testableJustification += ` ${acAnalysis.nonTestableCount} AC(s) could be clearer; using 'Verify that...' or 'Given/When/Then' helps.`;
        }
    }
    const testable = { score: testableScore, justification: testableJustification };

    const total = independent.score + negotiable.score + valuable.score + estimable.score + small.score + testable.score;
    return { total, independent, negotiable, valuable, estimable, small, testable };
}


// =================================================================
// REPORTING & FORMATTING
// =================================================================

/**
 * Formats the complete analysis into a human-readable Markdown report.
 * @param {object} analysis - The complete analysis object.
 * @returns {string} A formatted Markdown string.
 */
function formatAnalysisAsMarkdown(analysis) {
    const {
        overallReadinessScore: overall,
        clarityAndRequirementAnalysis: clarity,
        investCriteriaAssessment: invest,
        outstandingQueriesAndConflicts: queries,
        actionableRecommendations: recs
    } = analysis;

    const investReport = Object.entries(invest)
        .filter(([key]) => key !== 'totalScore')
        .map(([key, value]) => {
            const status = value.score >= 8 ? '✅ Meets' : value.score >= 5 ? '⚠️ Partially Meets' : '❌ Does Not Meet';
            return `* **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${status}\n    * *Justification:* ${value.justification}`;
        }).join('\n');

    const report = `
### **Overall Readiness Score: ${overall.readinessRating}/100**
**${overall.readinessCategory}**
*${overall.summary}*
---
### 1. Clarity and Requirement Analysis
* **Format Check:** ${clarity.formatCheck.feedback}
* **Clarity & Ambiguity:** ${clarity.clarityAmbiguity.feedback}
* **Acceptance Criteria:** ${clarity.acceptanceCriteria.feedback}

### 2. INVEST Criteria Assessment
${investReport}

### 3. Outstanding Queries & Conflicts
${queries.length > 0 ? queries.map(q => `* ${q}`).join('\n') : '* No major queries or conflicts identified. Great job!*'}

### 4. Actionable Recommendations
**Suggested Improvements:**
${recs.suggestedImprovements.length > 0 ? recs.suggestedImprovements.map(i => `* ${i}`).join('\n') : '* The story is in good shape. No major improvements suggested.*'}

${recs.inferredAcceptanceCriteria.length > 0 ? `
**Inferred Acceptance Criteria (for confirmation):**
*As a starting point, here are some potential acceptance criteria. Please review and refine them:*
${recs.inferredAcceptanceCriteria.map(ac => `* \`${ac}\``).join('\n')}
` : ''}

${recs.storyDecomposition.length > 0 ? `
**Story Decomposition Suggestions:**
*This story seems a bit large. Consider splitting it into smaller, valuable stories like these:*
${recs.storyDecomposition.map(s => `* \`${s}\``).join('\n')}
` : ''}
    `;
    return report.trim();
}

/**
 * Generates the final analysis object.
 * @param {string} story
 * @param {string} acceptanceCriteriaText
 * @returns {object} The complete analysis object.
 */
function generateAnalysisObject(story, acceptanceCriteriaText) {
    const clarityAnalysis = analyzeClarityAndRequirement(story, acceptanceCriteriaText);
    const investAnalysis = analyzeINVEST(story, clarityAnalysis, acceptanceCriteriaText);

    // Generate Queries and Recommendations
    let queries = [];
    let improvements = [];
    let inferredAC = [];
    let decomposition = [];

    if (clarityAnalysis.formatCheck.score < CONFIG.SCORING.FORMAT_SUCCESS) {
        improvements.push(`Rephrase the story to fit the standard format: "As a [persona], I want [goal], so that [value]". This structure ensures all key components are present.`);
    }
    if (clarityAnalysis.acceptanceCriteria.score === CONFIG.SCORING.AC_MISSING) {
        queries.push("The acceptance criteria are missing. Could you define the specific conditions that must be met for this story to be considered complete?");
        inferredAC = inferAcceptanceCriteria(clarityAnalysis.formatMatch);
    }
    if (investAnalysis.valuable.score < 10) {
        queries.push("What is the specific value or benefit this story delivers to the persona or the business? A clear value statement helps prioritize the work.");
    }
    if (investAnalysis.small.score < CONFIG.SCORING.INVEST_DEFAULT_HIGH) {
        queries.push("This story seems large. Is it possible to split it into smaller pieces that can be completed in a single sprint?");
        decomposition = suggestDecomposition(clarityAnalysis.formatMatch);
    }
    if (investAnalysis.testable.score < CONFIG.SCORING.INVEST_DEFAULT_HIGH && clarityAnalysis.acceptanceCriteria.score > 0) {
        improvements.push("Some acceptance criteria could be more specific. Using formats like 'Given/When/Then' or 'Verify that...' can make them easier to test.");
    }

    const totalPossibleScore = 40 + 60;
    const actualScore = clarityAnalysis.total + investAnalysis.total;
    const percentage = Math.round((actualScore / totalPossibleScore) * 100);
    const categoryInfo = getReadinessCategory(percentage);

    return {
        overallReadinessScore: {
            readinessRating: percentage,
            readinessCategory: categoryInfo.label,
            summary: categoryInfo.summary,
        },
        clarityAndRequirementAnalysis: { ...clarityAnalysis, totalScore: clarityAnalysis.total },
        investCriteriaAssessment: { ...investAnalysis, totalScore: investAnalysis.total },
        outstandingQueriesAndConflicts: queries,
        actionableRecommendations: {
            suggestedImprovements: improvements,
            inferredAcceptanceCriteria: inferredAC,
            storyDecomposition: decomposition
        }
    };
}


// =================================================================
// MAIN EXPORTED FUNCTION
// =================================================================

/**
 * Analyzes a user story and returns a formatted Markdown report.
 * @param {string} story - The user story text.
 * @param {string} [acceptanceCriteriaText=""] - The acceptance criteria text.
 * @returns {string} A formatted Markdown report with analysis and recommendations.
 */
function analyzeUserStory(story, acceptanceCriteriaText = "") {
    if (!story || typeof story !== 'string' || story.trim() === '') {
        return `
### 🚫 Analysis Halted
**It looks like the user story is missing.**
Please provide the story you'd like me to analyze. A great story usually looks like this:
*"As a [type of user], I want [to perform some action], so that [I can achieve some goal]."*
`;
    }

    const analysisObject = generateAnalysisObject(story, acceptanceCriteriaText);
    return formatAnalysisAsMarkdown(analysisObject);
}

// Make the main function available for export.
module.exports = { analyzeUserStory };
