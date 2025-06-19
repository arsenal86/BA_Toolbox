// userStoryAgent.js

const STORY_FORMAT_REGEX = /As an? (.*), I want (.*), so that (.*)/i;

function getReadinessCategory(score) {
    if (score >= 90) return { label: "✅ Excellent – Ready for Development", summary: "Story is well-formed, clear, and meets all INVEST criteria. Minimal or no changes needed." };
    if (score >= 71) return { label: "⚠️ At Standard Expected – Minor Refinement Needed", summary: "Mostly ready with small gaps. Can be addressed quickly." };
    if (score >= 50) return { label: "❗ Requires Improvement – Needs Refinement", summary: "Multiple issues present. Not ready for development without rework." };
    return { label: "🚫 Not Ready – Fundamentally Incomplete", summary: "Lacks essential components. Requires major revision or clarification." };
}

function analyzeClarityAndRequirement(story, acceptanceCriteriaText) {
    let formatScore = 0;
    let formatFeedback = "";
    const formatMatch = story.match(STORY_FORMAT_REGEX);

    if (formatMatch) {
        formatScore = 10;
        formatFeedback = "Story follows the standard 'As a [persona], I want [goal], so that [value]' format.";
    } else {
        formatScore = 2; // Some points if a story is provided, even if not perfect format
        formatFeedback = "Story does not strictly follow the 'As a [persona], I want [goal], so that [value]' format. This format helps ensure role, action, and benefit are clear. Consider rephrasing.";
    }

    // Clarity & Ambiguity (Simple checks for now, can be expanded)
    let clarityScore = 0;
    let clarityFeedback = [];
    if (story.length < 20) { // Arbitrary short length
        clarityFeedback.push("Story seems very short, ensure it's sufficiently detailed.");
        clarityScore += 5;
    } else {
        clarityScore += 10; // Base score for decent length
    }
    if (story.toLowerCase().includes("should") || story.toLowerCase().includes("could") || story.toLowerCase().includes("might")) {
        clarityFeedback.push("Avoid ambiguous terms like 'should', 'could', or 'might'. Be specific.");
    } else {
        clarityScore += 5; // Bonus for avoiding common ambiguous words
    }
    const clarityFinalScore = Math.min(15, clarityScore);
    const clarityFinalFeedback = clarityFeedback.length > 0 ? clarityFeedback.join(" ") : "Language appears reasonably clear.";


    // Acceptance Criteria
    let acScore = 0;
    let acFeedback = "";
    if (acceptanceCriteriaText && acceptanceCriteriaText.trim().length > 0) {
        const criteria = acceptanceCriteriaText.split('\n').filter(c => c.trim() !== '');
        if (criteria.length > 0) {
            acScore = 15;
            acFeedback = `Acceptance criteria provided (${criteria.length} criteria found). Ensure they are specific and testable.`;
            // Basic testability check (very naive)
            const testableKeywords = ["verify that", "ensure that", "given", "when", "then"];
            let nonTestableCount = 0;
            criteria.forEach(c => {
                if (!testableKeywords.some(kw => c.toLowerCase().includes(kw))) {
                    nonTestableCount++;
                }
            });
            if (nonTestableCount > criteria.length / 2) {
                acScore -= 5; // Deduct if many ACs don't seem testable
                acFeedback += " Some ACs may not be easily testable; consider phrasing with keywords like 'Verify that...', 'Ensure that...', or using Gherkin (Given/When/Then).";
            }
        } else {
            acScore = 5;
            acFeedback = "Acceptance criteria section is present but empty. Please define clear, testable acceptance criteria.";
        }
    } else {
        acScore = 0;
        acFeedback = "Acceptance criteria are missing. Clear, testable acceptance criteria are essential for development and testing. Please infer and provide them, for example: 'Given [context], When [action], Then [outcome].'";
    }
    const acFinalScore = Math.max(0, acScore); // Ensure score isn't negative

    const totalClarityScore = formatScore + clarityFinalScore + acFinalScore;

    return {
        total: totalClarityScore,
        formatCheck: { score: formatScore, feedback: formatFeedback },
        clarityAmbiguity: { score: clarityFinalScore, feedback: clarityFinalFeedback },
        acceptanceCriteria: { score: acFinalScore, feedback: acFeedback }
    };
}

function analyzeINVEST(story, acceptanceCriteriaText) {
    // These are subjective and will be simplified for this agent
    // In a real scenario, more sophisticated NLP or heuristics would be needed.

    let independentScore = 7; // Default, assuming mostly independent
    let independentJustification = "Assumed to be developable independently. Review for hidden dependencies.";
    if (story.toLowerCase().includes("dependent on") || story.toLowerCase().includes("after")) {
        independentScore = 3;
        independentJustification = "Story may have dependencies based on keywords. Clarify if it can be worked on without external blockers.";
    }

    let negotiableScore = 8;
    let negotiableJustification = "Story seems to describe 'what' not 'how'. Allows for discussion on implementation.";
    // Simple check: if it contains very technical terms, it might be too prescriptive.
    const technicalTerms = ["database schema", "api endpoint", "react component", "algorithm"];
    if (technicalTerms.some(term => story.toLowerCase().includes(term))) {
        negotiableScore = 5;
        negotiableJustification = "Story might be too prescriptive with technical details. Focus on user needs, leave implementation details for development team discussion.";
    }


    let valuableScore = 5;
    let valuableJustification = "Value needs to be clearly articulated in the 'so that' part.";
    const formatMatch = story.match(STORY_FORMAT_REGEX);
    if (formatMatch && formatMatch[3] && formatMatch[3].trim().length > 5) {
        valuableScore = 10;
        valuableJustification = `Value proposition '${formatMatch[3]}' seems clear.`;
    } else {
        valuableJustification = "The 'so that [value]' part of the story is missing or unclear. Clearly state the benefit to the user or business.";
    }


    let estimableScore = 6;
    let estimableJustification = "Scope needs to be clear for estimation. Ensure ACs are well-defined.";
    if (acceptanceCriteriaText && acceptanceCriteriaText.trim().length > 10 && story.length > 30) { // Basic check
        estimableScore = 8;
        estimableJustification = "Story and ACs provide a basis for estimation. Refine if team finds it hard to estimate.";
    } else {
        estimableJustification = "Story or ACs may be too vague or missing, making estimation difficult. Please provide more detail.";
    }


    let smallScore = 7;
    let smallJustification = "Assumed to be completable within a sprint. If estimation is large, consider splitting.";
    if (story.length > 200 || (acceptanceCriteriaText && acceptanceCriteriaText.split('\n').length > 7)) { // Arbitrary limits
        smallScore = 4;
        smallJustification = "Story or number of ACs seems large. Consider if it can be broken down into smaller, valuable pieces.";
    }

    let testableScore = 5;
    let testableJustification = "Testability depends heavily on clear ACs.";
     if (acceptanceCriteriaText && acceptanceCriteriaText.trim().length > 0) {
        const criteria = acceptanceCriteriaText.split('\n').filter(c => c.trim() !== '');
        if (criteria.length > 0) {
            testableScore = 8; // Base score if ACs exist
            testableJustification = "Acceptance criteria provided. Ensure they are unambiguous and allow for clear pass/fail conditions.";
            const testableKeywords = ["verify that", "ensure that", "given", "when", "then"];
            let nonTestableCount = 0;
            criteria.forEach(c => {
                if (!testableKeywords.some(kw => c.toLowerCase().includes(kw))) {
                    nonTestableCount++;
                }
            });
            if (nonTestableCount > 0) { // If any AC doesn't seem easily testable
                testableScore -= 2 * nonTestableCount; // Deduct points
                testableJustification += ` ${nonTestableCount} AC(s) may benefit from clearer testable language (e.g., using 'Verify that...', 'Given/When/Then').`;
            }
             if (testableScore < 0) testableScore = 0;
        } else {
            testableJustification = "Acceptance criteria section is present but empty. Testability cannot be assessed without defined ACs.";
        }
    } else {
        testableJustification = "Acceptance criteria are missing. Stories cannot be effectively tested without them.";
    }
    const testableFinalScore = Math.max(0, testableScore);


    const totalInvestScore = independentScore + negotiableScore + valuableScore + estimableScore + smallScore + testableFinalScore;

    return {
        total: totalInvestScore,
        independent: { score: independentScore, justification: independentJustification },
        negotiable: { score: negotiableScore, justification: negotiableJustification },
        valuable: { score: valuableScore, justification: valuableJustification },
        estimable: { score: estimableScore, justification: estimableJustification },
        small: { score: smallScore, justification: smallJustification },
        testable: { score: testableFinalScore, justification: testableJustification }
    };
}

function generateOverallReadiness(clarityScore, investScore) {
    const totalPossibleScore = 40 + 60;
    const actualScore = clarityScore + investScore;
    const percentage = Math.round((actualScore / totalPossibleScore) * 100);
    const categoryInfo = getReadinessCategory(percentage);

    return {
        readinessRating: percentage,
        readinessCategory: categoryInfo.label,
        summary: categoryInfo.summary,
        scoreBreakdown: {
            clarityRequirementAnalysis: clarityScore,
            investCriteriaAssessment: investScore
        }
    };
}

function generateQueriesAndRecommendations(story, clarityAnalysis, investAnalysis) {
    let queries = [];
    let recommendations = {
        suggestedImprovements: [],
        storyDecomposition: [] // Placeholder for now
    };

    if (clarityAnalysis.formatCheck.score < 10) {
        recommendations.suggestedImprovements.push(`Rephrase story to fit: "As a [persona], I want [goal], so that [value]". Current: "${story}"`);
    }
    if (clarityAnalysis.clarityAmbiguity.score < 15 && clarityAnalysis.clarityAmbiguity.feedback !== "Language appears reasonably clear.") {
        recommendations.suggestedImprovements.push(`Improve clarity: ${clarityAnalysis.clarityAmbiguity.feedback}`);
    }
    if (clarityAnalysis.acceptanceCriteria.score < 15) {
        queries.push("Could you provide or refine the acceptance criteria to be more specific and testable?");
        if (!clarityAnalysis.acceptanceCriteria.feedback.includes("missing")) {
             recommendations.suggestedImprovements.push(`Refine ACs: ${clarityAnalysis.acceptanceCriteria.feedback}`);
        } else {
             recommendations.suggestedImprovements.push(`Add ACs: ${clarityAnalysis.acceptanceCriteria.feedback}`);
        }
    }

    if (investAnalysis.independent.score < 7) {
        queries.push("Are there any hidden dependencies for this story? Can it truly be developed independently?");
        recommendations.suggestedImprovements.push(`Clarify independence: ${investAnalysis.independent.justification}`);
    }
    if (investAnalysis.negotiable.score < 7) {
        recommendations.suggestedImprovements.push(`Make story more negotiable: ${investAnalysis.negotiable.justification}`);
    }
    if (investAnalysis.valuable.score < 7) {
        queries.push("What is the specific value or benefit this story delivers to the persona or business?");
        recommendations.suggestedImprovements.push(`Clarify value: ${investAnalysis.valuable.justification}`);
    }
    if (investAnalysis.estimable.score < 7) {
        queries.push("Is the scope clear enough for the team to estimate effort? More details or clearer ACs might be needed.");
        recommendations.suggestedImprovements.push(`Improve estimability: ${investAnalysis.estimable.justification}`);
    }
    if (investAnalysis.small.score < 7) {
        queries.push("Is this story small enough to be completed in a single sprint? If not, how can it be split?");
        recommendations.suggestedImprovements.push(`Consider story size: ${investAnalysis.small.justification}`);
        // Basic decomposition suggestion
        recommendations.storyDecomposition.push("If the story is too large, consider splitting it by acceptance criteria, or by sub-steps in the user's workflow. Each smaller story should still be valuable and testable.");
    }
    if (investAnalysis.testable.score < 7) {
         queries.push("Are the success conditions clear and testable? How would you verify this story is done?");
        recommendations.suggestedImprovements.push(`Improve testability: ${investAnalysis.testable.justification}`);
    }

    // Consolidate recommendations into a string
    let finalRecs = recommendations.suggestedImprovements.length > 0 ? recommendations.suggestedImprovements.join("\n") : "Story is in good shape, minor tweaks based on feedback might be useful.";


    return {
        outstandingQueriesAndConflicts: queries,
        actionableRecommendations: {
            suggestedImprovements: finalRecs,
            storyDecomposition: recommendations.storyDecomposition
        }
    };
}


function analyzeUserStory(story, acceptanceCriteriaText = "") {
    if (!story || typeof story !== 'string' || story.trim() === '') {
        // Handle fundamentally incomplete story as per "Initial Interaction"
        return {
            overallReadinessScore: {
                readinessRating: 0,
                readinessCategory: "🚫 Not Ready – Fundamentally Incomplete",
                summary: "Story is empty or missing. Please provide a user story.",
                scoreBreakdown: { clarityRequirementAnalysis: 0, investCriteriaAssessment: 0 }
            },
            clarityAndRequirementAnalysis: {
                formatCheck: { score: 0, feedback: "No story provided." },
                clarityAmbiguity: { score: 0, feedback: "No story provided." },
                acceptanceCriteria: { score: 0, feedback: "No story provided." }
            },
            investCriteriaAssessment: {
                independent: { score: 0, justification: "No story provided." },
                negotiable: { score: 0, justification: "No story provided." },
                valuable: { score: 0, justification: "No story provided." },
                estimable: { score: 0, justification: "No story provided." },
                small: { score: 0, justification: "No story provided." },
                testable: { score: 0, justification: "No story provided." }
            },
            outstandingQueriesAndConflicts: ["What is the user story you would like to analyze?"],
            actionableRecommendations: {
                suggestedImprovements: "Please provide the user story text.",
                storyDecomposition: []
            }
        };
    }


    const clarityAnalysis = analyzeClarityAndRequirement(story, acceptanceCriteriaText);
    const investAnalysis = analyzeINVEST(story, acceptanceCriteriaText);
    const overallReadiness = generateOverallReadiness(clarityAnalysis.total, investAnalysis.total);
    const queriesAndRecs = generateQueriesAndRecommendations(story, clarityAnalysis, investAnalysis);

    return {
        overallReadinessScore: overallReadiness,
        clarityAndRequirementAnalysis: {
            formatCheck: clarityAnalysis.formatCheck,
            clarityAmbiguity: clarityAnalysis.clarityAmbiguity,
            acceptanceCriteria: clarityAnalysis.acceptanceCriteria,
            // Adding total score for this section for completeness, matching prompt's "Score Breakdown"
            totalScore: clarityAnalysis.total
        },
        investCriteriaAssessment: {
            independent: investAnalysis.independent,
            negotiable: investAnalysis.negotiable,
            valuable: investAnalysis.valuable,
            estimable: investAnalysis.estimable,
            small: investAnalysis.small,
            testable: investAnalysis.testable,
            // Adding total score for this section for completeness
            totalScore: investAnalysis.total
        },
        outstandingQueriesAndConflicts: queriesAndRecs.outstandingQueriesAndConflicts,
        actionableRecommendations: queriesAndRecs.actionableRecommendations
    };
}

module.exports = { analyzeUserStory };
