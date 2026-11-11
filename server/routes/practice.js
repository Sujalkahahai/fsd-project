import express from 'express';
import mongoose from 'mongoose';
import PracticeLog from '../models/PracticeLog.js';
import Topic from '../models/Topic.js';
import { protect } from '../middleware/auth.js';
import { notifyPathlogUser } from '../utils/notifications.js';

const router = express.Router();
router.use(protect);

// GET /api/practice - List user's practice logs (optionally filtered by topicId)
router.get('/', async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.topicId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.topicId)) {
        return res.status(400).json({ success: false, message: 'Invalid topicId' });
      }
      filter.topicId = req.query.topicId;
    }

    const logs = await PracticeLog.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// POST /api/practice - Record a practice / study session
router.post('/', async (req, res, next) => {
  try {
    const { topicId, correct, difficulty, isRepeat, notes } = req.body || {};

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ success: false, message: 'Valid topicId is required' });
    }
    if (typeof correct !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Practice result (correct: true/false) is required' });
    }

    const topic = await Topic.findOne({ _id: topicId, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const practiceLog = await PracticeLog.create({
      topicId: topic._id,
      subjectId: topic.subjectId,
      userId: req.user._id,
      correct,
      difficulty: difficulty || 'medium',
      isRepeat: Boolean(isRepeat),
      notes: notes ? String(notes).trim() : '',
    });

    // Invariant: Practice activity resets the topic's revision clock
    topic.lastActivityAt = new Date();
    await topic.save();

    notifyPathlogUser(req, {
      type: 'practice.logged',
      title: 'Practice Logged',
      message: `Practice session recorded for "${topic.title}" (${correct ? 'Correct' : 'Needs review'}).`,
      practiceId: practiceLog.id,
      topicId: topic.id,
    });

    return res.status(201).json({ success: true, data: practiceLog });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/practice/:id - Delete a practice log
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practice log ID' });
    }

    const log = await PracticeLog.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Practice log not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

