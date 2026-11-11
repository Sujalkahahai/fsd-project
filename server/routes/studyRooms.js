import express from 'express';
import mongoose from 'mongoose';
import StudyRoom from '../models/StudyRoom.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/study-rooms - List study rooms
router.get('/', async (_req, res, next) => {
  try {
    const rooms = await StudyRoom.find()
      .populate('hostId', 'name')
      .populate('activeUserIds', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
});

// POST /api/study-rooms - Create a new study room
router.post('/', async (req, res, next) => {
  try {
    const { name, topic } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const room = await StudyRoom.create({
      name: name.trim(),
      topic: topic ? String(topic).trim() : 'General Study',
      hostId: req.user._id,
      activeUserIds: [req.user._id],
    });

    const populated = await StudyRoom.findById(room._id)
      .populate('hostId', 'name')
      .populate('activeUserIds', 'name');

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// GET /api/study-rooms/:id - Get study room details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    const room = await StudyRoom.findById(id)
      .populate('hostId', 'name')
      .populate('activeUserIds', 'name');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
});

// POST /api/study-rooms/:id/join - Join room
router.post('/:id/join', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.activeUserIds.some((uid) => uid.toString() === req.user._id.toString())) {
      room.activeUserIds.push(req.user._id);
      await room.save();
    }

    const updated = await StudyRoom.findById(id)
      .populate('hostId', 'name')
      .populate('activeUserIds', 'name');

    // Notify room via socket if io is attached
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${id}`).emit('room:userJoined', {
        userId: req.user._id.toString(),
        userName: req.user.name,
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/study-rooms/:id/leave - Leave room
router.post('/:id/leave', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    room.activeUserIds = room.activeUserIds.filter(
      (uid) => uid.toString() !== req.user._id.toString()
    );
    await room.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`room:${id}`).emit('room:userLeft', {
        userId: req.user._id.toString(),
        userName: req.user.name,
      });
    }

    return res.json({ success: true, message: 'Left room' });
  } catch (err) {
    next(err);
  }
});

export default router;

