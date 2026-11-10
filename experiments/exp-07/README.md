# Experiment 7 — Real-Time Features using WebSockets and Socket.IO

## Aim
To implement real-time communication in the Pathlog web application using WebSockets and Socket.IO by establishing an authenticated connection between the React frontend and Node.js backend and displaying real-time notifications for supported Pathlog activities.

## Implemented
- **Socket.IO Backend Integration (`server/server.js`):**
  - Integrated `http.createServer(app)` and configured Socket.IO `Server` with CORS credentials and origin settings.
  - Attached Socket.IO instance to Express via `app.set('io', io)` for direct controller and utility access.
  - Implemented JWT authentication middleware (`io.use`) validating Bearer tokens extracted from handshake auth data against `JWT_SECRET`.
  - Joined authenticated clients to private user rooms (`socket.join(userId)`).
  - Added connection and disconnection logging.
- **Notification Dispatch Utility (`server/utils/notifications.js`):**
  - Created `notifyPathlogUser(req, notification)` helper targeting the authenticated user's private room (`io.to(userId).emit('pathlog:notification', ...)`).
  - Scoped notifications to avoid broadcasting private actions to other users.
- **Controller Triggers (`server/app.js`):**
  - Triggered real-time notifications on creation (`POST /api/events` -> `event.created`), update (`PUT /api/events/:id` -> `event.updated`), and deletion (`DELETE /api/events/:id` -> `event.deleted`).
- **Frontend Real-Time Socket Layer (`src/services/socket.js`, `src/context/NotificationContext.jsx`):**
  - Configured singleton Socket.IO client reading session token from `localStorage` (`pathlog-auth-token`).
  - Managed notification state, unread badge counter, and socket lifecycle in `NotificationContext` tied to user authentication status.
  - Properly cleaned up listeners and disconnected on sign-out to prevent connection leaks.
- **Notification UI (`src/components/NotificationBell.jsx`, `src/App.jsx`):**
  - Built `NotificationBell` with unread badge count, popover dropdown, empty state, individual item display, timestamp formatting, and clear-all functionality.
  - Integrated into Pathlog's top navigation bar for authenticated users.
- **Automated Verification (`server/api.test.js`):**
  - Validated token rejection on missing and invalid auth.
  - Verified authenticated connection establishment.
  - Verified user-scoped event notification delivery and privacy isolation across users.

## Execution Commands (PowerShell)

```powershell
# 1. Run automated test suite (including Socket.IO integration and RBAC)
npm.cmd run test:api

# 2. Start the Backend API & Socket.IO Server (Terminal 1)
npm.cmd run server

# 3. Start the React Frontend (Terminal 2)
npm.cmd run dev
```

- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:5000/api/health`
- Socket.IO Path: `http://localhost:5000/socket.io/`

