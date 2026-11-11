import express from 'express';
import mongoose from 'mongoose';
import Template from '../models/Template.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Resource from '../models/Resource.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/authorize.js';
import { notifyPathlogUser } from '../utils/notifications.js';

const router = express.Router();
router.use(protect);

// GET /api/templates - List templates (learners see published; admins see all)
router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { isPublished: true };
    const templates = await Template.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

// POST /api/templates - Create a template (Admin only)
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const { title, description, category, topics, isPublished } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const template = await Template.create({
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : 'General',
      createdBy: req.user._id,
      isPublished: Boolean(isPublished),
      topics: Array.isArray(topics) ? topics : [],
    });

    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

// PUT /api/templates/:id - Update template (Admin only)
router.put('/:id', adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template ID' });
    }

    const template = await Template.findByIdAndUpdate(id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/templates/:id - Delete template (Admin only)
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template ID' });
    }

    const template = await Template.findByIdAndDelete(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/templates/:id/clone - Clone a curated template into the user's subjects
router.post('/:id/clone', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template ID' });
    }

    const template = await Template.findById(id);
    if (!template || (!template.isPublished && req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Template not found or not published' });
    }

    // 1. Create a new Subject for this user
    const newSubject = await Subject.create({
      userId: req.user._id,
      title: template.title,
      why: `Cloned from template: ${template.description.slice(0, 200)}`,
    });

    // 2. Clone each topic and its resources
    for (const t of template.topics || []) {
      const newTopic = await Topic.create({
        subjectId: newSubject._id,
        userId: req.user._id,
        title: t.title,
        importance: t.importance || 2,
        revisionThresholdDays: t.revisionThresholdDays || 14,
        confidence: 3,
        lastActivityAt: null,
      });

      if (Array.isArray(t.resources) && t.resources.length > 0) {
        const resourceDocs = t.resources.map((r) => ({
          topicId: newTopic._id,
          subjectId: newSubject._id,
          userId: req.user._id,
          title: r.title,
          url: r.url || '',
          type: r.type || 'article',
          done: false,
        }));
        await Resource.insertMany(resourceDocs);
      }
    }

    notifyPathlogUser(req, {
      type: 'template.cloned',
      title: 'Template Cloned',
      message: `Template "${template.title}" was added to your subjects.`,
      subjectId: newSubject.id,
    });

    return res.status(201).json({
      success: true,
      message: `Successfully cloned template "${template.title}"`,
      data: newSubject,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

