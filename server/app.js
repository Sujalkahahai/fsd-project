import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Event from './models/Event.js';
import authRoutes from './routes/auth.js';
import { protect } from './middleware/auth.js';
import { adminOnly } from './middleware/authorize.js';
import { notifyPathlogUser } from './utils/notifications.js';

const requiredFields = ['title', 'description', 'date', 'time', 'location', 'category'];

function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid request payload';
  }
  for (const field of requiredFields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `Required fields: ${requiredFields.join(', ')}`;
    }
  }
  return null;
}

const app = express();

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, data: { status: 'ok', database: dbStatus } });
});

// 1. GET /api/events - Retrieve all events (Public or Authenticated)
app.get('/api/events', async (_req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: events });
  } catch (err) {
    return next(err);
  }
});

// 2. GET /api/events/:id - Retrieve an event by ID (Public or Authenticated)
app.get('/api/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.json({ success: true, data: event });
  } catch (err) {
    return next(err);
  }
});

// 3. POST /api/events - Create an event (Admin only: protected via protect + adminOnly)
app.post('/api/events', protect, adminOnly, async (req, res, next) => {
  try {
    const error = validateBody(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const newEvent = await Event.create({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      date: req.body.date.trim(),
      time: req.body.time.trim(),
      location: req.body.location.trim(),
      category: req.body.category.trim(),
      tone: req.body.tone || 'bg-teal-50 text-teal-700',
    });

    notifyPathlogUser(req, {
      type: 'event.created',
      title: 'Event Created',
      message: `"${newEvent.title}" has been successfully created.`,
      eventId: newEvent.id,
    });

    return res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    return next(err);
  }
});

// 4. PUT /api/events/:id - Update an event (Admin only: protected via protect + adminOnly)
app.put('/api/events/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const error = validateBody(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        date: req.body.date.trim(),
        time: req.body.time.trim(),
        location: req.body.location.trim(),
        category: req.body.category.trim(),
        tone: req.body.tone || 'bg-teal-50 text-teal-700',
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    notifyPathlogUser(req, {
      type: 'event.updated',
      title: 'Event Updated',
      message: `"${updatedEvent.title}" has been updated.`,
      eventId: updatedEvent.id,
    });

    return res.json({ success: true, data: updatedEvent });
  } catch (err) {
    return next(err);
  }
});

// 5. DELETE /api/events/:id - Delete an event (Admin only: protected via protect + adminOnly)
app.delete('/api/events/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    notifyPathlogUser(req, {
      type: 'event.deleted',
      title: 'Event Deleted',
      message: `"${deletedEvent.title}" has been deleted.`,
      eventId: deletedEvent.id,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// Error handling middleware
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }
  return res.status(500).json({ success: false, message: error.message || 'Unexpected server error' });
});

export default app;
