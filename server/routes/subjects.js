import express from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Resource from '../models/Resource.js';
import PracticeLog from '../models/PracticeLog.js';
import Assessment from '../models/Assessment.js';
import { protect } from '../middleware/auth.js';
import { notifyPathlogUser } from '../utils/notifications.js';
import { calculateTopicEvidence, calculateRevisionStatus } from '../utils/evidence.js';

const router = express.Router();
router.use(protect); // All subject operations require authentication

// GET /api/subjects - List user's subjects with summary progress
router.get('/', async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Enrich subjects with topic count and resource exposure
    const enriched = await Promise.all(
      subjects.map(async (subj) => {
        const topicCount = await Topic.countDocuments({ subjectId: subj._id });
        const resources = await Resource.find({ subjectId: subj._id }).select('done');
        const resourcesTotal = resources.length;
        const resourcesDone = resources.filter((r) => r.done).length;

        return {
          ...subj.toJSON(),
          topicCount,
          resourcesDone,
          resourcesTotal,
          exposureFraction: resourcesTotal > 0 ? `${resourcesDone}/${resourcesTotal}` : '0/0',
        };
      })
    );

    return res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects - Create a new subject
router.post('/', async (req, res, next) => {
  try {
    const { title, why, targetDate } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Subject title is required' });
    }

    const subject = await Subject.create({
      userId: req.user._id,
      title: title.trim(),
      why: why ? String(why).trim() : '',
      targetDate: targetDate ? new Date(targetDate) : null,
    });

    notifyPathlogUser(req, {
      type: 'subject.created',
      title: 'Subject Added',
      message: `Subject "${subject.title}" was created successfully.`,
      subjectId: subject.id,
    });

    return res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
});

// GET /api/subjects/:id - Get single subject with its topics
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject ID' });
    }

    const subject = await Subject.findOne({ _id: id, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topics = await Topic.find({ subjectId: id, userId: req.user._id }).sort({ createdAt: 1 });

    // Enrich each topic with resource exposure and evidence status
    const enrichedTopics = await Promise.all(
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

    return res.json({
      success: true,
      data: {
        ...subject.toJSON(),
        topics: enrichedTopics,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subjects/:id - Update subject
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject ID' });
    }

    const { title, why, targetDate } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Subject title is required' });
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        title: title.trim(),
        why: why ? String(why).trim() : '',
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    notifyPathlogUser(req, {
      type: 'subject.updated',
      title: 'Subject Updated',
      message: `Subject "${subject.title}" was updated.`,
      subjectId: subject.id,
    });

    return res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:id - Delete subject and cascade delete topics, resources, practice, assessments
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject ID' });
    }

    const subject = await Subject.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Cascade delete all children belonging to this subject
    await Topic.deleteMany({ subjectId: id });
    await Resource.deleteMany({ subjectId: id });
    await PracticeLog.deleteMany({ subjectId: id });
    await Assessment.deleteMany({ subjectId: id });

    notifyPathlogUser(req, {
      type: 'subject.deleted',
      title: 'Subject Deleted',
      message: `Subject "${subject.title}" and its topics were deleted.`,
      subjectId: subject.id,
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

