import express from 'express';
import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import Topic from '../models/Topic.js';
import { protect } from '../middleware/auth.js';
import { notifyPathlogUser } from '../utils/notifications.js';

const router = express.Router();
router.use(protect);

// GET /api/assessments - List user's assessments (optionally filtered by topicId)
router.get('/', async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.topicId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.topicId)) {
        return res.status(400).json({ success: false, message: 'Invalid topicId' });
      }
      filter.topicId = req.query.topicId;
    }

    const assessments = await Assessment.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: assessments });
  } catch (err) {
    next(err);
  }
});

// POST /api/assessments - Record an assessment score
router.post('/', async (req, res, next) => {
  try {
    const { topicId, title, score, maxMarks, noNotesUsed, date } = req.body || {};

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ success: false, message: 'Valid topicId is required' });
    }
    if (score === undefined || isNaN(Number(score))) {
      return res.status(400).json({ success: false, message: 'Valid numeric score is required' });
    }

    const numericScore = Number(score);
    if (numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' });
    }

    const topic = await Topic.findOne({ _id: topicId, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const assessment = await Assessment.create({
      topicId: topic._id,
      subjectId: topic.subjectId,
      userId: req.user._id,
      title: title ? String(title).trim() : 'Topic Quiz / Test',
      score: numericScore,
      maxMarks: Number(maxMarks) || 100,
      noNotesUsed: noNotesUsed !== undefined ? Boolean(noNotesUsed) : true,
      date: date ? new Date(date) : new Date(),
    });

    // Invariant: Assessment activity resets the topic's revision clock
    topic.lastActivityAt = new Date();
    await topic.save();

    notifyPathlogUser(req, {
      type: 'assessment.recorded',
      title: 'Assessment Recorded',
      message: `Score of ${numericScore}% recorded for "${topic.title}".`,
      assessmentId: assessment.id,
      topicId: topic.id,
    });

    return res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assessments/:id - Delete an assessment
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

