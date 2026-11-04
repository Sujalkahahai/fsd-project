# Experiment 4 — Development of RESTful APIs using Node.js and Express.js

## Aim
Create and test CRUD REST APIs for the Pathlog Labs event data and consume the API from the React frontend.

## Implemented
Express app/server separation, in-memory seeded event storage, health check, CRUD routes, validation, 400/404/500 handling, CORS, Vite proxy, frontend loading/error/retry states, and API-backed event rendering.

## Endpoints
`GET /api/health`, `GET /api/events`, `GET /api/events/:id`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`.

## Run
```powershell
npm.cmd install
npm.cmd run server
# second terminal
npm.cmd run dev
```
Frontend: `http://localhost:5173/lab/experiment-2/events`  
API: `http://localhost:5000/api/health`

## Limitations
Storage is in memory and resets when the server restarts. Registration remains browser-local and frontend-only. No authentication or database is included.
