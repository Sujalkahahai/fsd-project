import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import PracticeLog from '../models/PracticeLog.js';
import Assessment from '../models/Assessment.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/authorize.js';

const router = express.Router();
router.use(protect);
router.use(adminOnly);

// GET /api/admin/users - List all users
router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().select('_id name email role isSuspended createdAt').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/suspend - Toggle user suspension
router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.isSuspended = !targetUser.isSuspended;
    await targetUser.save();

    return res.json({
      success: true,
      message: `User ${targetUser.email} is now ${targetUser.isSuspended ? 'suspended' : 'active'}`,
      data: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isSuspended: targetUser.isSuspended,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - Platform overview statistics
router.get('/stats', async (_req, res, next) => {
  try {
    const [usersCount, subjectsCount, topicsCount, practiceCount, assessmentsCount] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Topic.countDocuments(),
      PracticeLog.countDocuments(),
      Assessment.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        usersCount,
        subjectsCount,
        topicsCount,
        practiceCount,
        assessmentsCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

