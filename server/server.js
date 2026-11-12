import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import connectDB from './config/db.js';
import { autoSeedTemplates, bootstrapAdminUser } from './seed.js';
import User from './models/User.js';

const port = process.env.PORT || 5000;
const host = '0.0.0.0';

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO with CORS using CLIENT_ORIGIN
const clientOrigin = process.env.CLIENT_ORIGIN;
const allowedOrigins = clientOrigin
  ? (clientOrigin.includes(',') ? clientOrigin.split(',').map((o) => o.trim()) : clientOrigin)
  : '*';

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: allowedOrigins !== '*',
  },
});

// Make Socket.IO instance accessible to Express controllers via req.app.get('io')
app.set('io', io);

// Socket.IO JWT authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Server configuration error'));
    }

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('_id name email role isSuspended');
    if (!user) {
      return next(new Error('User not found'));
    }

    if (user.isSuspended) {
      return next(new Error('Account is suspended'));
    }

    // Attach user info to socket
    socket.data.userId = user._id.toString();
    socket.data.userName = user.name;
    socket.data.user = user;
    next();
  } catch (_err) {
    next(new Error('Invalid or expired token'));
  }
});

// Connection and disconnection handlers
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const userName = socket.data.userName;

  // Join the user-specific private room for personal notifications
  socket.join(userId);
  console.log(`[Socket.IO] Pathlog user connected: ${userName} (${userId})`);

  // Handle study room events
  socket.on('study:join_room', (roomId) => {
    if (!roomId) return;
    socket.join(`room:${roomId}`);
    io.to(`room:${roomId}`).emit('study:peer_joined', {
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('study:leave_room', (roomId) => {
    if (!roomId) return;
    socket.leave(`room:${roomId}`);
    io.to(`room:${roomId}`).emit('study:peer_left', {
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('study:timer_action', ({ roomId, action, duration }) => {
    if (!roomId) return;
    io.to(`room:${roomId}`).emit('study:timer_update', {
      action, // 'start', 'pause', 'reset'
      duration,
      senderName: userName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('study:log_activity', ({ roomId, topicTitle, correct }) => {
    if (!roomId) return;
    io.to(`room:${roomId}`).emit('study:activity_feed', {
      userName,
      topicTitle,
      correct,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] User disconnected: ${userId} (${reason})`);
  });
});

async function startServer() {
  try {
    await connectDB();
    await bootstrapAdminUser();
    await autoSeedTemplates();
    server.listen(port, host, () => {
      console.log(`Pathlog API with Socket.IO listening on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
}

// Only start the server if this module is run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export { app, server, io };
