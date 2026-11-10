import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import connectDB from './config/db.js';
import { autoSeedEvents, bootstrapAdminUser } from './seed.js';
import User from './models/User.js';

const port = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
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
    const user = await User.findById(payload.sub).select('_id name email role');
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    socket.data.userId = user._id.toString();
    socket.data.user = user;
    next();
  } catch (_err) {
    next(new Error('Invalid or expired token'));
  }
});

// Connection and disconnection handlers
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  // Join the user-specific private room
  socket.join(userId);
  console.log(`[Socket.IO] Pathlog client connected: ${socket.id} (User ID: ${userId})`);

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Pathlog client disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

async function startServer() {
  try {
    await connectDB();
    await autoSeedEvents();
    await bootstrapAdminUser();
    server.listen(port, () => {
      console.log(`Pathlog API with Socket.IO listening on http://localhost:${port}`);
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
