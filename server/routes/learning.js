import express from 'express';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Resource from '../models/Resource.js';
import PracticeLog from '../models/PracticeLog.js';
import Assessment from '../models/Assessment.js';
import { protect } from '../middleware/auth.js';
import { calculateTopicEvidence, calculateRevisionStatus, generateNextActions } from '../utils/evidence.js';

const router = express.Router();
router.use(protect);

/**
 * Helper to fetch all topics for the current user with all their associated metadata,
 * computed evidence, and revision statuses.
 */
async function getUserTopicsWithMeta(userId) {
  const subjects = await Subject.find({ userId }).sort({ createdAt: -1 });
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

  const topics = await Topic.find({ userId }).sort({ createdAt: 1 });
  const allResources = await Resource.find({ userId });
  const allPractice = await PracticeLog.find({ userId }).sort({ createdAt: -1 });
  const allAssessments = await Assessment.find({ userId }).sort({ createdAt: -1 });

  // Group by topicId
  const resourcesByTopic = new Map();
  for (const r of allResources) {
    const tid = r.topicId.toString();
    if (!resourcesByTopic.has(tid)) resourcesByTopic.set(tid, []);
    resourcesByTopic.get(tid).push(r);
  }

  const practiceByTopic = new Map();
  for (const p of allPractice) {
    const tid = p.topicId.toString();
    if (!practiceByTopic.has(tid)) practiceByTopic.set(tid, []);
    practiceByTopic.get(tid).push(p);
  }

  const assessmentsByTopic = new Map();
  for (const a of allAssessments) {
    const tid = a.topicId.toString();
    if (!assessmentsByTopic.has(tid)) assessmentsByTopic.set(tid, []);
    assessmentsByTopic.get(tid).push(a);
  }

  return topics.map((topic) => {
    const tid = topic._id.toString();
    const subject = subjectMap.get(topic.subjectId.toString()) || { title: 'Unknown Subject' };
    const topicResources = resourcesByTopic.get(tid) || [];
    const topicPractice = practiceByTopic.get(tid) || [];
    const topicAssessments = assessmentsByTopic.get(tid) || [];

    const resourcesTotal = topicResources.length;
    const resourcesDone = topicResources.filter((r) => r.done).length;

    const evidence = calculateTopicEvidence(topicPractice, topicAssessments, topic.confidence);
    const revision = calculateRevisionStatus(topic, evidence.status);

    return {
      topic: topic.toJSON(),
      subject: subject.toJSON ? subject.toJSON() : subject,
      resourcesTotal,
      resourcesDone,
      exposureFraction: resourcesTotal > 0 ? `${resourcesDone}/${resourcesTotal}` : '0/0',
      evidence,
      revision,
    };
  });
}

// GET /api/learning/dashboard - Comprehensive dashboard overview
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user._id;

    const subjectsCount = await Subject.countDocuments({ userId });
    const topicsCount = await Topic.countDocuments({ userId });
    const totalResources = await Resource.countDocuments({ userId });
    const doneResources = await Resource.countDocuments({ userId, done: true });
    const totalPractice = await PracticeLog.countDocuments({ userId });
    const correctPractice = await PracticeLog.countDocuments({ userId, correct: true });
    const totalAssessments = await Assessment.countDocuments({ userId });

    const upcomingSubjects = await Subject.find({
      userId,
      targetDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .sort({ targetDate: 1 })
      .limit(3);

    const items = await getUserTopicsWithMeta(userId);

    // Filter revision due topics
    const revisionDueTopics = items
      .filter((item) => item.revision.isDue)
      .map((item) => ({
        topicId: item.topic.id,
        topicTitle: item.topic.title,
        subjectTitle: item.subject.title,
        subjectId: item.subject.id,
        daysSinceActivity: item.revision.daysSinceActivity,
        thresholdDays: item.revision.thresholdDays,
        reason: item.revision.reason,
        evidenceStatus: item.evidence.status,
        importance: item.topic.importance,
      }));

    // Generate prioritized next actions
    const nextActions = generateNextActions(items).slice(0, 6);

    // Find confidence mismatches (worth a second look)
    const confidenceMismatches = items
      .filter((item) => item.evidence.mismatch.hasMismatch)
      .map((item) => ({
        topicId: item.topic.id,
        topicTitle: item.topic.title,
        subjectTitle: item.subject.title,
        confidence: item.topic.confidence,
        evidenceStatus: item.evidence.status,
        note: item.evidence.mismatch.note,
      }));

    return res.json({
      success: true,
      data: {
        stats: {
          subjectsCount,
          topicsCount,
          totalResources,
          doneResources,
          exposureFraction: totalResources > 0 ? `${doneResources}/${totalResources}` : '0/0',
          totalPractice,
          practiceAccuracy: totalPractice > 0 ? Math.round((correctPractice / totalPractice) * 100) : null,
          totalAssessments,
          revisionDueCount: revisionDueTopics.length,
        },
        upcomingSubjects,
        revisionDueTopics,
        nextActions,
        confidenceMismatches,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/learning/revision-queue - All topics currently due for revision
router.get('/revision-queue', async (req, res, next) => {
  try {
    const items = await getUserTopicsWithMeta(req.user._id);

    const queue = items
      .filter((item) => item.revision.isDue)
      .map((item) => ({
        topicId: item.topic.id,
        topicTitle: item.topic.title,
        subjectTitle: item.subject.title,
        subjectId: item.subject.id,
        importance: item.topic.importance,
        confidence: item.topic.confidence,
        daysSinceActivity: item.revision.daysSinceActivity,
        thresholdDays: item.revision.thresholdDays,
        reason: item.revision.reason,
        evidenceStatus: item.evidence.status,
        evidenceReason: item.evidence.reason,
        recentAccuracy: item.evidence.recentAccuracy,
        exposureFraction: item.exposureFraction,
      }))
      .sort((a, b) => {
        // Sort nulls (initial practice needed) first, then longest overdue
        if (a.daysSinceActivity === null) return -1;
        if (b.daysSinceActivity === null) return 1;
        return (b.daysSinceActivity - b.thresholdDays) - (a.daysSinceActivity - a.thresholdDays);
      });

    return res.json({ success: true, data: queue });
  } catch (err) {
    next(err);
  }
});

// GET /api/learning/next-actions - Prioritized next study actions
router.get('/next-actions', async (req, res, next) => {
  try {
    const items = await getUserTopicsWithMeta(req.user._id);
    const actions = generateNextActions(items);
    return res.json({ success: true, data: actions });
  } catch (err) {
    next(err);
  }
});

export default router;

