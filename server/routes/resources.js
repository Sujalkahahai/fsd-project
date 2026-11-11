import express from 'express';
import mongoose from 'mongoose';
import Resource from '../models/Resource.js';
import Topic from '../models/Topic.js';
import { protect } from '../middleware/auth.js';
import { notifyPathlogUser } from '../utils/notifications.js';

const router = express.Router();
router.use(protect);

// GET /api/resources - List resources (optionally filtered by topicId)
router.get('/', async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.topicId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.topicId)) {
        return res.status(400).json({ success: false, message: 'Invalid topicId' });
      }
      filter.topicId = req.query.topicId;
    }

    const resources = await Resource.find(filter).sort({ createdAt: 1 });
    return res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
});

// POST /api/resources - Add a new learning resource link
router.post('/', async (req, res, next) => {
  try {
    const { topicId, title, url, type } = req.body || {};

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ success: false, message: 'Valid topicId is required' });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Resource title is required' });
    }

    const topic = await Topic.findOne({ _id: topicId, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const resource = await Resource.create({
      topicId: topic._id,
      subjectId: topic.subjectId,
      userId: req.user._id,
      title: title.trim(),
      url: url ? String(url).trim() : '',
      type: type || 'article',
      done: false,
    });

    notifyPathlogUser(req, {
      type: 'resource.created',
      title: 'Resource Added',
      message: `"${resource.title}" was added to topic "${topic.title}".`,
      resourceId: resource.id,
      topicId: topic.id,
    });

    return res.status(201).json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
});

// PUT /api/resources/:id - Update resource
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const { title, url, type, done } = req.body || {};
    const updates = {};
    if (title && typeof title === 'string' && title.trim()) updates.title = title.trim();
    if (url !== undefined) updates.url = String(url).trim();
    if (type !== undefined) updates.type = type;
    if (done !== undefined) updates.done = Boolean(done);

    const resource = await Resource.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/resources/:id/toggle - Toggle completion status
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const resource = await Resource.findOne({ _id: id, userId: req.user._id });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    resource.done = !resource.done;
    await resource.save();

    notifyPathlogUser(req, {
      type: resource.done ? 'resource.completed' : 'resource.updated',
      title: resource.done ? 'Resource Completed' : 'Resource Marked Incomplete',
      message: `"${resource.title}" is now marked ${resource.done ? 'done' : 'pending'}.`,
      resourceId: resource.id,
      topicId: resource.topicId,
    });

    return res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const resource = await Resource.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

