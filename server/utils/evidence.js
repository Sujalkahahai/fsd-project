/**
 * Pathlog Evidence & Revision Rules Engine
 * 
 * Invariants from docs/PRODUCT.md:
 * 1. Evidence before confidence (performance evidence separate from self-rated confidence).
 * 2. Resource exposure (done/total) measures exposure, not mastery.
 * 3. Revision clock resets only on practice or assessment, never on resource toggles.
 * 4. Deterministic rules, plain-language explanations, no arbitrary vanity scores.
 */

/**
 * Calculates evidence status and recent accuracy for a topic.
 * 
 * @param {Array} practiceLogs - Array of practice log documents (newest first)
 * @param {Array} assessments - Array of assessment documents (newest first)
 * @param {number} confidence - Learner self-rated confidence (1-5)
 * @returns {object} { status, reason, recentAccuracy, totalPractice, totalAssessments, mismatch }
 */
export function calculateTopicEvidence(practiceLogs = [], assessments = [], confidence = 3) {
  const totalPractice = practiceLogs.length;
  const totalAssessments = assessments.length;

  // Use last ~10 practice logs for recent accuracy
  const recentLogs = practiceLogs.slice(0, 10);
  const recentCount = recentLogs.length;
  const recentCorrect = recentLogs.filter((p) => p.correct).length;
  const recentAccuracy = recentCount > 0 ? Math.round((recentCorrect / recentCount) * 100) : null;

  // Best assessment score if any exists
  const bestScore = totalAssessments > 0 ? Math.max(...assessments.map((a) => a.score)) : null;

  let status;
  let reason;

  if ((bestScore !== null && bestScore >= 75) || (recentCount >= 5 && recentAccuracy >= 80)) {
    status = 'Strong';
    reason = bestScore !== null && bestScore >= 75
      ? `Strong performance: assessment score of ${bestScore}%.`
      : `Consistent practice: ${recentAccuracy}% accuracy across ${recentCount} recent attempts.`;
  } else if ((bestScore !== null && bestScore >= 50) || (recentCount >= 3 && recentAccuracy >= 60)) {
    status = 'Moderate';
    reason = bestScore !== null && bestScore >= 50
      ? `Passing assessment score of ${bestScore}%.`
      : `Satisfactory practice: ${recentAccuracy}% accuracy across ${recentCount} recent attempts.`;
  } else if (recentCount >= 1 || (bestScore !== null && bestScore < 50)) {
    status = 'Limited';
    reason = bestScore !== null && bestScore < 50
      ? `Assessment score of ${bestScore}% is below passing; additional review recommended.`
      : `Only ${recentCount} practice attempt(s) recorded; more practice needed for solid evidence.`;
  } else {
    status = 'Needs attention';
    reason = recentCount >= 3 && recentAccuracy < 50
      ? `Recent practice accuracy is ${recentAccuracy}%; revision and targeted practice recommended.`
      : 'No practice or assessment logged yet; understanding has not been tested.';
  }

  // Self-rated confidence mismatch detection
  let mismatch = {
    hasMismatch: false,
    note: '',
  };

  if (confidence >= 4 && (status === 'Limited' || status === 'Needs attention')) {
    mismatch = {
      hasMismatch: true,
      note: `Worth a second look: High self-rated confidence (${confidence}/5) despite ${status.toLowerCase()} logged evidence.`,
    };
  } else if (confidence <= 2 && status === 'Strong') {
    mismatch = {
      hasMismatch: true,
      note: `Worth a second look: Low self-rated confidence (${confidence}/5) despite strong logged evidence.`,
    };
  }

  return {
    status,
    reason,
    recentAccuracy,
    recentCount,
    bestScore,
    totalPractice,
    totalAssessments,
    mismatch,
  };
}

/**
 * Calculates revision due status for a topic.
 * Weak evidence (Limited / Needs attention) shortens revision threshold to 7 days.
 * 
 * @param {object} topic - The topic object { revisionThresholdDays, lastActivityAt }
 * @param {string} evidenceStatus - 'Strong' | 'Moderate' | 'Limited' | 'Needs attention'
 * @returns {object} { isDue, daysSinceActivity, thresholdDays, reason }
 */
export function calculateRevisionStatus(topic, evidenceStatus = 'Needs attention') {
  // 7 days for weak evidence; otherwise topic threshold (default 14)
  const isWeak = evidenceStatus === 'Limited' || evidenceStatus === 'Needs attention';
  const thresholdDays = isWeak ? 7 : (topic.revisionThresholdDays || 14);

  if (!topic.lastActivityAt) {
    return {
      isDue: true,
      daysSinceActivity: null,
      thresholdDays,
      reason: 'Needs initial practice session (no practice or assessment recorded yet).',
    };
  }

  const now = Date.now();
  const lastTime = new Date(topic.lastActivityAt).getTime();
  const diffMs = Math.max(0, now - lastTime);
  const daysSinceActivity = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isDue = daysSinceActivity >= thresholdDays;

  return {
    isDue,
    daysSinceActivity,
    thresholdDays,
    reason: isDue
      ? `Overdue: last practiced ${daysSinceActivity} day(s) ago (threshold: ${thresholdDays} days).`
      : `Up to date: practiced ${daysSinceActivity} day(s) ago (due in ${thresholdDays - daysSinceActivity} days).`,
  };
}

/**
 * Categorizes topics into explainable priority tiers for Next Actions.
 * 
 * @param {Array} topicItems - Array of topics with their computed evidence, revision, and resources
 * @returns {Array} Sorted actionable recommendations
 */
export function generateNextActions(topicItems = []) {
  const actions = [];

  for (const item of topicItems) {
    const { topic, subject, evidence, revision, resourcesDone = 0, resourcesTotal = 0 } = item;

    if (revision.isDue && topic.importance === 3) {
      actions.push({
        topicId: topic.id || topic._id,
        topicTitle: topic.title,
        subjectId: subject.id || subject._id,
        subjectTitle: subject.title,
        tier: 1,
        priorityLabel: 'Urgent Revision',
        priorityColor: 'red',
        importance: topic.importance,
        reason: `High importance topic: ${revision.reason}`,
        actionType: 'practice',
      });
    } else if (revision.isDue || evidence.status === 'Needs attention') {
      actions.push({
        topicId: topic.id || topic._id,
        topicTitle: topic.title,
        subjectId: subject.id || subject._id,
        subjectTitle: subject.title,
        tier: 2,
        priorityLabel: 'Targeted Focus',
        priorityColor: 'amber',
        importance: topic.importance,
        reason: revision.isDue ? revision.reason : evidence.reason,
        actionType: 'practice',
      });
    } else if (resourcesDone > 0 && evidence.totalPractice === 0) {
      actions.push({
        topicId: topic.id || topic._id,
        topicTitle: topic.title,
        subjectId: subject.id || subject._id,
        subjectTitle: subject.title,
        tier: 3,
        priorityLabel: 'Practice Needed',
        priorityColor: 'indigo',
        importance: topic.importance,
        reason: `${resourcesDone}/${resourcesTotal} resources completed, but no practice sessions logged yet.`,
        actionType: 'practice',
      });
    } else if (resourcesTotal > resourcesDone) {
      actions.push({
        topicId: topic.id || topic._id,
        topicTitle: topic.title,
        subjectId: subject.id || subject._id,
        subjectTitle: subject.title,
        tier: 4,
        priorityLabel: 'Next Resource',
        priorityColor: 'slate',
        importance: topic.importance,
        reason: `Exposure: ${resourcesDone}/${resourcesTotal} resources completed. Continue studying material.`,
        actionType: 'resource',
      });
    }
  }

  // Sort by tier ascending (Tier 1 first), then importance descending (3 first)
  return actions.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.importance - a.importance;
  });
}
