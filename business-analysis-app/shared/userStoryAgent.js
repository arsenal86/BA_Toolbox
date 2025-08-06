/**
 * @fileoverview A script to analyze a user story based on clarity and INVEST principles.
 * @version 2.0.0
 */

// =================================================================
// CONFIGURATION
// Centralized configuration for scores, keywords, and feedback.
// This makes the agent easier to tune and maintain.
// =================================================================
const CONFIG = {
    STORY_FORMAT_REGEX: /As an? (.*), I want (.*), so that (.*)/i,
    THRESHOLDS: {
        SHORT_STORY_LENGTH: 25,
        LONG_STORY_LENGTH: 200,
        MAX_ACCEPTANCE_CRITERIA: 7,
    },
    KEYWORDS: {
        AMBIGUOUS: ["should", "could", "might"],
        DEPENDENCIES: ["dependent on", "after", "following", "once"],
        TECHNICAL: ["database schema", "api endpoint", "react component", "algorithm", "sql query"],
        TESTABLE_AC: ["verify that", "ensure that", "given", "when", "then", "confirm that"],
    },
    SCORING: {
        // Clarity & Requirement Analysis (Max: 40)
        FORMAT_SUCCESS: 10,
        FORMAT_FAIL: 2,
        CLARITY_BASE: 10,
        CLARITY_BONUS_CONCISE: 5, // Bonus for not being too short
        CLARITY_BONUS_SPECIFIC: 5, // Bonus for avoiding ambiguous words
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
        { score: 90, label: "✅ Excellent – Ready for Development", summary: "Story is well-formed, clear, and meets all INVEST criteria. Minimal or no changes needed." },
        { score: 71, label: "⚠️ At Standard Expected – Minor Refinement Needed", summary: "Mostly ready with small gaps. Can be addressed quickly." },
        { score: 50, label: "❗ Requires Improvement – Needs Refinement", summary: "Multiple issues present. Not ready for development without rework." },
        { score: 0,  label: "🚫 Not Ready – Fundamentally Incomplete", summary: "Lacks essential components. Requires major revision or clarification." },
    ]
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Gets the readiness category based on a percentage score.
 * @param {number} score - The overall percentage score (0-100).
 * @returns {{label: string, summary: string}} The readiness category information.
 */
function getReadinessCategory(score) {
    return CONFIG.READINESS_CATEGORIES.find(cat => score >= cat.score);
}

/**
 * Analyzes acceptance criteria for presence and testability.
 * This helper function avoids code duplication.
 * @param {string} acceptanceCriteriaText - The raw text of the acceptance criteria.
 * @returns {{criteria: string[], testableKeywordsFound: boolean, nonTestableCount: number}} Analysis result.
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
        if (!isTestable) {
            nonTestableCount++;
        } else {
            testableKeywordsFound = true;
        }
    });

    return { criteria, testableKeywordsFound, nonTestableCount };
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

    if (acceptanceCriteriaText) { // Check if the field was provided at all
        if (acAnalysis.criteria.length > 0) {
            acScore = CONFIG.SCORING.AC_PROVIDED;
            acFeedback = `Acceptance criteria provided (${acAnalysis.criteria.length} criteria found). Ensure they are specific and testable.`;
            if (acAnalysis.nonTestableCount > acAnalysis.criteria.length / 2) {
                acScore -= CONFIG.SCORING.AC_NON_TESTABLE_DEDUCTION;
                acFeedback += " Some ACs may not be easily testable; consider phrasing with keywords like 'Verify that...' or using Gherkin (Given/When/Then).";
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
        acceptanceCriteria: { score: acScore, feedback: acFeedback }
    };
}

/**
 * Assesses the story against the INVEST criteria.
 * @param {string} story - The user story text.
 * @param {string} acceptanceCriteriaText - The acceptance criteria text.
 * @returns {object} A detailed analysis of each INVEST principle.
 */
function analyzeINVEST(story, acceptanceCriteriaText) {
    const acAnalysis = analyzeAcceptanceCriteria(acceptanceCriteriaText);
    const formatMatch = story.match(CONFIG.STORY_FORMAT_REGEX);

    // Independent
    const hasDependencyKeywords = CONFIG.KEYWORDS.DEPENDENCIES.some(term => story.toLowerCase().includes(term));
    const independent = {
        score: hasDependencyKeywords ? CONFIG.SCORING.INVEST_DEFAULT_LOW : CONFIG.SCORING.INVEST_DEFAULT_MEDIUM,
        justification: hasDependencyKeywords ? "Story may have dependencies based on keywords. Clarify if it can be worked on without external blockers." : "Assumed to be developable independently. Review for hidden dependencies."
    };

    // Negotiable
    const hasTechnicalTerms = CONFIG.KEYWORDS.TECHNICAL.some(term => story.toLowerCase().includes(term));
    const negotiable = {
        score: hasTechnicalTerms ? CONFIG.SCORING.INVEST_DEFAULT_LOW : CONFIG.SCORING.INVEST_DEFAULT_HIGH,
        justification: hasTechnicalTerms ? "Story might be too prescriptive with technical details. Focus on user needs, not implementation." : "Story seems to describe 'what' not 'how', allowing for implementation discussion."
    };

    // Valuable
    const hasClearValue = formatMatch && formatMatch[3] && formatMatch[3].trim().length > 5;
    const valuable = {
        score: hasClearValue ? 10 : CONFIG.SCORING.INVEST_DEFAULT_LOW,
        justification: hasClearValue ? `Value proposition '${formatMatch[3]}' seems clear.` : "The 'so that [value]' part of the story is missing or unclear. State the benefit to the user or business."
    };

    // Estimable
    const isEstimable = acAnalysis.criteria.length > 0 && story.length > CONFIG.THRESHOLDS.SHORT_STORY_LENGTH;
    const estimable = {
        score: isEstimable ? CONFIG.SCORING.INVEST_DEFAULT_HIGH : CONFIG.SCORING.INVEST_DEFAULT_MEDIUM,
        justification: isEstimable ? "Story and ACs provide a solid basis for estimation." : "Story or ACs may be too vague or missing, making estimation difficult. Please provide more detail."
    };

    // Small
    const isLarge = story.length > CONFIG.THRESHOLDS.LONG_STORY_LENGTH || acAnalysis.criteria.length > CONFIG.THRESHOLDS.MAX_ACCEPTANCE_CRITERIA;
    const small = {
        score: isLarge ? CONFIG.SCORING.INVEST_DEFAULT_LOW : CONFIG.SCORING.INVEST_DEFAULT_HIGH,
        justification: isLarge ? "Story or number of ACs seems large. Consider if it can be broken down into smaller, valuable pieces." : "Story appears to be a reasonable size, likely completable within a single sprint."
    };

    // Testable
    let testableScore = CONFIG.SCORING.INVEST_DEFAULT_LOW;
    let testableJustification = "Testability cannot be assessed without clear acceptance criteria.";
    if (acAnalysis.criteria.length > 0) {
        testableScore = acAnalysis.testableKeywordsFound ? CONFIG.SCORING.INVEST_DEFAULT_HIGH : CONFIG.SCORING.INVEST_DEFAULT_MEDIUM;
        testableJustification = "Acceptance criteria provided. Ensure they are unambiguous and allow for clear pass/fail conditions.";
        if (acAnalysis.nonTestableCount > 0) {
            testableJustification += ` ${acAnalysis.nonTestableCount} AC(s) may benefit from clearer testable language (e.g., using 'Verify that...').`;
        }
    }
    const testable = { score: testableScore, justification: testableJustification };

    const total = independent.score + negotiable.score + valuable.score + estimable.score + small.score + testable.score;

    return { total, independent, negotiable, valuable, estimable, small, testable };
}

/**
 * Generates the final analysis object, including overall score and recommendations.
 * @param {string} story - The user story text.
 * @param {string} acceptanceCriteriaText - The acceptance criteria text.
 * @returns {object} The complete user story analysis.
 */
function analyzeUserStory(story, acceptanceCriteriaText = "") {
    if (!story || typeof story !== 'string' || story.trim() === '') {
        return {
            error: "Story is empty or missing. Please provide a user story to analyze.",
            ...generateEmptyReport()
        };
    }

    const clarityAnalysis = analyzeClarityAndRequirement(story, acceptanceCriteriaText);
    const investAnalysis = analyzeINVEST(story, acceptanceCriteriaText);

    const totalPossibleScore = 40 + 60; // Clarity + INVEST
    const actualScore = clarityAnalysis.total + investAnalysis.total;
    const percentage = Math.round((actualScore / totalPossibleScore) * 100);
    const categoryInfo = getReadinessCategory(percentage);

    const overallReadiness = {
        readinessRating: percentage,
        readinessCategory: categoryInfo.label,
        summary: categoryInfo.summary,
        scoreBreakdown: {
            clarityRequirementAnalysis: clarityAnalysis.total,
            investCriteriaAssessment: investAnalysis.total
        }
    };

    const { queries, recommendations } = generateQueriesAndRecommendations(story, clarityAnalysis, investAnalysis);

    return {
        overallReadinessScore: overallReadiness,
        clarityAndRequirementAnalysis: { ...clarityAnalysis, totalScore: clarityAnalysis.total },
        investCriteriaAssessment: { ...investAnalysis, totalScore: investAnalysis.total },
        outstandingQueriesAndConflicts: queries,
        actionableRecommendations: recommendations
    };
}

// =================================================================
// REPORTING & RECOMMENDATION GENERATION
// =================================================================

/**
 * Generates actionable recommendations based on the analysis.
 * @param {string} story - The user story text.
 * @param {object} clarityAnalysis - The results from analyzeClarityAndRequirement.
 * @param {object} investAnalysis - The results from analyzeINVEST.
 * @returns {{queries: string[], recommendations: object}} Generated queries and recommendations.
 */
function generateQueriesAndRecommendations(story, clarityAnalysis, investAnalysis) {
    let queries = [];
    let improvements = [];
    let decomposition = [];

    // Map analysis results to queries and recommendations
    if (clarityAnalysis.formatCheck.score < CONFIG.SCORING.FORMAT_SUCCESS) {
        improvements.push(`Rephrase story to fit the standard format: "As a [persona], I want [goal], so that [value]".`);
    }
    if (clarityAnalysis.acceptanceCriteria.score < CONFIG.SCORING.AC_PROVIDED) {
        queries.push("Could you provide or refine the acceptance criteria to be more specific and testable?");
        improvements.push(`Refine ACs: ${clarityAnalysis.acceptanceCriteria.feedback}`);
    }
    if (investAnalysis.valuable.score < 10) {
        queries.push("What is the specific value or benefit this story delivers?");
        improvements.push(`Clarify value: ${investAnalysis.valuable.justification}`);
    }
    if (investAnalysis.small.score < CONFIG.SCORING.INVEST_DEFAULT_HIGH) {
        queries.push("Is this story small enough for one sprint? If not, how can it be split?");
        improvements.push(`Consider story size: ${investAnalysis.small.justification}`);
        decomposition.push("If the story is too large, consider splitting it by acceptance criteria, or by sub-steps in the user's workflow. Each smaller story should still be valuable and testable.");
    }
    if (investAnalysis.testable.score < CONFIG.SCORING.INVEST_DEFAULT_HIGH) {
        queries.push("Are the success conditions clear and testable? How would you verify this story is done?");
        improvements.push(`Improve testability: ${investAnalysis.testable.justification}`);
    }
    if (investAnalysis.independent.score < CONFIG.SCORING.INVEST_DEFAULT_MEDIUM) {
        queries.push("Are there any hidden dependencies? Can this be developed independently?");
        improvements.push(`Clarify independence: ${investAnalysis.independent.justification}`);
    }
    
    return {
        queries,
        recommendations: {
            suggestedImprovements: improvements.length > 0 ? improvements.join("\n") : "Story is in good shape. No major improvements suggested.",
            storyDecomposition: decomposition
        }
    };
}

/**
 * Generates a blank report for invalid initial input.
 * @returns {object} An empty report structure.
 */
function generateEmptyReport() {
    const emptySection = { score: 0, feedback: "No story provided." };
    const emptyInvest = { score: 0, justification: "No story provided." };
    return {
        overallReadinessScore: {
            readinessRating: 0,
            readinessCategory: getReadinessCategory(0).label,
            summary: "Story is empty or missing. Please provide a user story.",
            scoreBreakdown: { clarityRequirementAnalysis: 0, investCriteriaAssessment: 0 }
        },
        clarityAndRequirementAnalysis: { formatCheck: emptySection, clarityAmbiguity: emptySection, acceptanceCriteria: emptySection },
        investCriteriaAssessment: { independent: emptyInvest, negotiable: emptyInvest, valuable: emptyInvest, estimable: emptyInvest, small: emptyInvest, testable: emptyInvest },
        outstandingQueriesAndConflicts: ["What is the user story you would like to analyze?"],
        actionableRecommendations: { suggestedImprovements: "Please provide the user story text.", storyDecomposition: [] }
    };
}


// Make the main function available for export.
module.exports = { analyzeUserStory };
