# Experiment 6 — JWT Authentication and Role-Based Authorization

## Aim
Implement user authentication using JSON Web Tokens (JWT) and role-based authorization (RBAC) using Node.js, Express.js, MongoDB Atlas, Mongoose, and React.

## Implemented
- **User Mongoose Model (`server/models/User.js`):** Fields `name`, `email` (unique, lowercase), `password` (hashed with `bcrypt` salt rounds 12, hidden by default with `select: false`), and `role` (`'user' | 'admin'`, defaults to `'user'`).
- **JWT Generation & Verification (`server/middleware/auth.js`):** Issues signed tokens containing `{ sub: user._id, role: user.role }` signed with `JWT_SECRET` and expiring per `JWT_EXPIRES_IN`. Validates Bearer token headers in `protect` middleware.
- **Role-based Access Control (`server/middleware/authorize.js`):** `adminOnly` middleware strictly rejects non-admin users with `403 Forbidden`.
- **Authentication Endpoints (`server/routes/auth.js`):**
  - `POST /api/auth/register`: Public registration (forced `role: 'user'`).
  - `POST /api/auth/login`: Email/password verification using `bcrypt.compare` returning JWT and user profile.
  - `GET /api/auth/me`: Authenticated user profile retrieval.
- **Protected Event CRUD Operations (`server/app.js`):**
  - `GET /api/events` & `GET /api/events/:id`: Public event viewing.
  - `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`: Enforced with `protect` + `adminOnly`.
- **Initial Admin Bootstrapping (`server/seed.js`):** Idempotent server startup checks for existing admin. If absent, provisions a controlled initial admin account from environment configurations without exposing public admin registration.
- **Frontend Authentication & RBAC UI (`src/context/AuthContext.jsx`, `src/App.jsx`):**
  - Registration and Login modal dialogs.
  - Context-managed session with automatic `/api/auth/me` verification.
  - Dynamic navbar reflecting user status and admin badge.
  - Admin-only "Add Event" modal and "Delete Event" controls sending `Authorization: Bearer <token>`.
  - Filter chips, search bar, and browser-local event registration preserved.

## Verification & Commands

```powershell
# 1. Run automated test suite verifying auth lifecycle, security, and RBAC
npm.cmd run test:api

# 2. Start the Backend API (Terminal 1)
npm.cmd run server

# 3. Start the React Frontend (Terminal 2)
npm.cmd run dev
```

- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:5000/api/health`
- Postman Collection: `experiments/exp-06/postman/Experiment_6_JWT_Auth.postman_collection.json`

