import express from 'express';
import mongoose from 'mongoose';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import Resource from '../models/Resource.js';
import PracticeLog from '../models/PracticeLog.js';
import Assessment from '../models/Assessment.js';
import { protect } from '../middleware/auth.js';
import { notifyPathlogUser } from '../utils/notifications.js';
import { calculateTopicEvidence, calculateRevisionStatus } from '../utils/evidence.js';

const router = express.Router();
router.use(protect);

// GET /api/topics - List user's topics (optionally filtered by subjectId)
router.get('/', async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.subjectId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subjectId' });
      }
      filter.subjectId = req.query.subjectId;
    }

    const topics = await Topic.find(filter).sort({ createdAt: 1 });

    const enriched = await Promise.all(
      topics.map(async (topic) => {
        const resources = await Resource.find({ topicId: topic._id });
        const practiceLogs = await PracticeLog.find({ topicId: topic._id }).sort({ createdAt: -1 });
        const assessments = await Assessment.find({ topicId: topic._id }).sort({ createdAt: -1 });

        const resourcesTotal = resources.length;
        const resourcesDone = resources.filter((r) => r.done).length;

        const evidence = calculateTopicEvidence(practiceLogs, assessments, topic.confidence);
        const revision = calculateRevisionStatus(topic, evidence.status);

        return {
          ...topic.toJSON(),
          resourcesTotal,
          resourcesDone,
          exposureFraction: resourcesTotal > 0 ? `${resourcesDone}/${resourcesTotal}` : '0/0',
          evidence,
          revision,
        };
      })
    );

    return res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// POST /api/topics - Create a new topic under a subject
router.post('/', async (req, res, next) => {
  try {
    const { subjectId, title, importance, revisionThresholdDays, confidence } = req.body || {};

    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Valid subjectId is required' });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Topic title is required' });
    }

    // Verify subject ownership
    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topic = await Topic.create({
      subjectId: subject._id,
      userId: req.user._id,
      title: title.trim(),
      importance: Number(importance) || 2,
      revisionThresholdDays: Number(revisionThresholdDays) || 14,
      confidence: Number(confidence) || 3,
      lastActivityAt: null, // Starts with no practice/assessment
    });

    notifyPathlogUser(req, {
      type: 'topic.created',
      title: 'Topic Added',
      message: `Topic "${topic.title}" was added to "${subject.title}".`,
      topicId: topic.id,
      subjectId: subject.id,
    });

    return res.status(201).json({ success: true, data: topic });
  } catch (err) {
    next(err);
  }
});

// GET /api/topics/:id - Get topic detail with its resources, practice logs & assessments
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid topic ID' });
    }

    const topic = await Topic.findOne({ _id: id, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const subject = await Subject.findById(topic.subjectId);
    const resources = await Resource.find({ topicId: topic._id }).sort({ createdAt: 1 });
    const practiceLogs = await PracticeLog.find({ topicId: topic._id }).sort({ createdAt: -1 });
    const assessments = await Assessment.find({ topicId: topic._id }).sort({ createdAt: -1 });

    const resourcesTotal = resources.length;
    const resourcesDone = resources.filter((r) => r.done).length;

    const evidence = calculateTopicEvidence(practiceLogs, assessments, topic.confidence);
    const revision = calculateRevisionStatus(topic, evidence.status);

    return res.json({
      success: true,
      data: {
        ...topic.toJSON(),
        subjectTitle: subject?.title || 'Unknown Subject',
        resources,
        resourcesTotal,
        resourcesDone,
        exposureFraction: resourcesTotal > 0 ? `${resourcesDone}/${resourcesTotal}` : '0/0',
        practiceLogs,
        assessments,
        evidence,
        revision,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/topics/:id - Update topic fields
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid topic ID' });
    }

    const { title, importance, revisionThresholdDays, confidence } = req.body || {};
    const updates = {};

    if (title && typeof title === 'string' && title.trim()) {
      updates.title = title.trim();
    }
    if (importance !== undefined) {
      updates.importance = Math.max(1, Math.min(3, Number(importance)));
    }
    if (revisionThresholdDays !== undefined) {
      updates.revisionThresholdDays = Math.max(1, Number(revisionThresholdDays));
    }
    if (confidence !== undefined) {
      updates.confidence = Math.max(1, Math.min(5, Number(confidence)));
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    return res.json({ success: true, data: topic });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/topics/:id - Delete topic and cascade delete child documents
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid topic ID' });
    }

    const topic = await Topic.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Cascade delete topic children
    await Resource.deleteMany({ topicId: id });
    await PracticeLog.deleteMany({ topicId: id });
    await Assessment.deleteMany({ topicId: id });

    notifyPathlogUser(req, {
      type: 'topic.deleted',
      title: 'Topic Deleted',
      message: `Topic "${topic.title}" was deleted.`,
      topicId: topic.id,
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

