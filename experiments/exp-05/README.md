# Experiment 5 — Integration of MongoDB and Mongoose with RESTful APIs

## Aim
Integrate MongoDB Atlas with the existing Express RESTful API using Mongoose, replace in-memory event storage with persistent database operations, and connect the React frontend.

## Implemented
- **MongoDB Atlas Integration:** Configured `config/db.js` with Mongoose `mongoose.connect()` loading connection strings securely via `.env`.
- **Mongoose Schema & Model:** Created `models/Event.js` with fields `title`, `description`, `date`, `time`, `location`, `category`, and `tone`. Utilized schema transforms to map `_id` to standard `id` for seamless frontend compatibility.
- **Persistent CRUD Operations:**
  1. `GET /api/events` — Retrieve all events from MongoDB Atlas using `Event.find().sort({ createdAt: -1 })`.
  2. `GET /api/events/:id` — Retrieve single event by MongoDB ObjectId with `Event.findById()`.
  3. `POST /api/events` — Create and persist a new event record with `Event.create()`.
  4. `PUT /api/events/:id` — Update existing event using `Event.findByIdAndUpdate()`.
  5. `DELETE /api/events/:id` — Delete event using `Event.findByIdAndDelete()`.
- **Validation & Error Handling:** Validates required fields, checks `mongoose.Types.ObjectId.isValid(id)` returning `400 Bad Request` for malformed IDs, `404 Not Found` for nonexistent items, and handles malformed JSON payloads.
- **Frontend Integration:** React frontend consumes `/api/events`, displays MongoDB-backed events, supports category filter chips, search filtering, and browser-local event registrations.

## Execution Commands (PowerShell)
```powershell
# 1. Install dependencies
npm.cmd install

# 2. Start the Backend API (Terminal 1)
npm.cmd run server

# 3. Start the React Frontend (Terminal 2)
npm.cmd run dev
```

- Frontend URL: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/health`
- Postman Collection: `experiments/exp-05/postman/Experiment_5_MongoDB_Event_API.postman_collection.json`
