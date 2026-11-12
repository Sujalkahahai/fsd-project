import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

// Import route modules
import authRoutes from './routes/auth.js';
import subjectsRoutes from './routes/subjects.js';
import topicsRoutes from './routes/topics.js';
import resourcesRoutes from './routes/resources.js';
import practiceRoutes from './routes/practice.js';
import assessmentsRoutes from './routes/assessments.js';
import learningRoutes from './routes/learning.js';
import templatesRoutes from './routes/templates.js';
import studyRoomsRoutes from './routes/studyRooms.js';
import adminRoutes from './routes/admin.js';

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN;
const corsOptions = clientOrigin
  ? {
      origin: clientOrigin.includes(',') ? clientOrigin.split(',').map((o) => o.trim()) : clientOrigin,
      credentials: true,
    }
  : {};

app.use(cors(corsOptions));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  return res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'Pathlog Learning Management API',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/study-rooms', studyRoomsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Centralized error handling middleware
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
  });
});

// Production static file serving for React frontend (SPA)
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

export default app;
