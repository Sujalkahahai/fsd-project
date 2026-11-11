# Pathlog — Evidence-Based Learning & Study Tracking Application

> **Full Stack Development (FSD) Mini Project & Lab Evaluation**  
> Built with React (Vite) + Tailwind CSS, Node.js + Express, MongoDB Atlas + Mongoose, JWT + bcrypt, and Socket.IO.

---

## 1. Problem Statement & Philosophy

Traditional study and checklist trackers confuse **viewing resources** with **actual understanding**. Checking off a YouTube tutorial or PDF reading only proves *exposure*, not *competence*.

**Pathlog** separates exposure from performance evidence:
- **Resource Exposure:** Displayed strictly as a raw fraction (`done/total`), never disguised as mastery.
- **Evidence Status:** Deterministically calculated as **Strong**, **Moderate**, **Limited**, or **Needs attention** with plain-language explanations based on verified practice logs and assessment scores.
- **Self-Rated Confidence:** Tracked independently on a 1–5 scale. If confidence disagrees with objective performance, Pathlog flags it as **"Worth a second look"**.
- **Revision Clock:** Resets **only** when active recall practice or assessments are completed — checking off links never resets the clock. Weak evidence shortens the revision threshold from 14 to 7 days.
- **Explainable Next Actions:** Prioritized in clear tiers (Urgent Revision, Targeted Focus, Practice Needed, Next Resource) with human-readable rationale.

---

## 2. Core Modules & Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │      React Frontend (Vite + Tailwind CSS)    │
                    │  Dashboard • Subjects • Revision • Collab    │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / WebSocket (JWT)
                    ┌──────────────────────▼───────────────────────┐
                    │       Express.js REST API & Socket.IO        │
                    │   Controllers • Evidence Engine • Middleware │
                    └──────────────────────┬───────────────────────┘
                                           │ Mongoose ODM
                    ┌──────────────────────▼───────────────────────┐
                    │       MongoDB Atlas (`pathlog_db`)           │
                    │ Users • Subjects • Topics • Practice • Tests │
                    └──────────────────────────────────────────────┘
```

### Models & Collections
- **`users`**: Identity, password hash (bcrypt), role (`learner`/`admin`), and account suspension flag.
- **`subjects`**: Enrolled study area, user ownership, why note (max 250 chars), and target exam date.
- **`topics`**: Topic under subject, importance (1–3), revision threshold (default 14d), self-confidence (1–5), and `lastActivityAt`.
- **`resources`**: Learning material links (video, article, doc, course), completion toggle (`done`).
- **`practicelogs`**: Practice attempt outcome (`correct: true/false`), difficulty (easy/med/hard), notes, timestamp.
- **`assessments`**: Quiz/test score (0–100%), closed-book flag (`noNotesUsed`), date.
- **`templates`**: Curated roadmap blueprints published by admins for 1-click cloning.
- **`studyrooms`**: Real-time collaborative virtual rooms with active presence and synchronized Pomodoro timer.

---

## 3. Evaluation Requirements Checklist

| Requirement | Implementation & Location |
|---|---|
| **1. Tailwind CSS** | Polished, responsive layout with slate background, indigo/purple accents (`src/styles.css`, `tailwind.config.js`). |
| **2. React & State** | Modular React components, React hooks (`useState`, `useEffect`, `useRef`), and Context API (`AuthContext`, `NotificationContext`). |
| **3. REST API** | Express 5 routing with standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and proper status codes (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`). |
| **4. MongoDB & Mongoose** | Complete Mongoose schemas with indexes, validation, population, and cascade deletion (`server/models/`). |
| **5. Data Validation** | Client-side input validation and Express route validation with descriptive JSON error payloads. |
| **6. Authentication & RBAC** | Password hashing with bcrypt, JWT token generation & verification (`server/middleware/auth.js`), role checks (`adminOnly`), and account suspension. |
| **7. Real-Time Socket.IO** | Authenticated WebSocket handshake, private user notifications (`pathlog:notification`), study room timer synchronization (`study:timer_action`), and activity feeds. |
| **8. Docker Containerization** | Multi-stage `Dockerfile` and `docker-compose.yml` for unified frontend build and backend production serving. |
| **9. DevOps & Deployment** | Working production static build (`dist/`), `/api/health` status endpoint, environment variable management, and automated test suite. |

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB Atlas connection URI or local MongoDB instance

### Environment Configuration
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pathlog_db?retryWrites=true&w=majority
JWT_SECRET=super-secure-jwt-secret-key-pathlog-2026
JWT_EXPIRES_IN=1d
ADMIN_NAME=Pathlog Admin
ADMIN_EMAIL=admin@pathlog.internal
ADMIN_PASSWORD=AdminPathlog2026!
CLIENT_ORIGIN=http://localhost:5173
```

### Running Commands (Windows PowerShell or CMD)

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Run Backend API server:**
   ```powershell
   npm run server
   ```
   *Runs at `http://localhost:5000` with auto-admin bootstrap and template seeding.*

3. **Run Frontend Vite development server (in a separate terminal):**
   ```powershell
   npm run dev
   ```
   *Runs at `http://localhost:5173`.*

4. **Run Production Build:**
   ```powershell
   npm run build
   ```
   *Compiles React frontend into `dist/` served statically by the Express backend.*

5. **Run Automated Test Suite:**
   ```powershell
   npm run test:api
   ```
   *Executes native Node test runner covering 11 critical modules with 100% pass rate.*

---

## 5. Docker Deployment

### Build and Run with Docker Compose:
```bash
docker compose up --build -d
```
The application will be accessible at `http://localhost:5000`.

---

## 6. Demonstration Sequence (10-Minute Viva Flow)

1. **Landing & Auth:**
   - Open `http://localhost:5173`.
   - Sign in as Admin (`admin@pathlog.internal` / `AdminPathlog2026!`) or Register a new student account.
2. **Dashboard Overview:**
   - Observe key metric cards: Subjects, Topics, Resource Exposure (`done/total`), Practice Accuracy, Revision Queue.
   - Inspect rule-based "Next Recommended Actions" with priority badges and explanations.
3. **Curated Templates (1-Click Cloning):**
   - Navigate to "Curated Roadmaps".
   - Click "Clone to My Subjects" on the MERN or DSA roadmap.
   - See instant real-time notification pop in the top-right notification bell!
4. **Subjects & Topics:**
   - Navigate to "Subjects & Topics" to view the cloned subject.
   - Expand subject to inspect topics, importance chips, and self-confidence rating.
   - Click "View Topic Details" to open the interactive modal.
5. **Separating Exposure from Evidence:**
   - In "Resources" tab, toggle links to "Done" — notice exposure updates to `done/total`, but evidence status stays "Needs attention" (exposure != mastery!).
   - In "Practice" tab, log 2-3 practice sessions (e.g. Solved Correctly) — observe evidence status change to "Moderate" or "Strong" and revision clock reset to 0 days!
   - In "Assessments" tab, record a 90% score with closed-book flag.
6. **Revision Queue & Mismatch Detection:**
   - Navigate to "Revision Queue" to view overdue topics requiring active recall.
   - If confidence is set to 5/5 but evidence is low, observe the "Worth a second look" alert.
7. **Collaborative Study Rooms:**
   - Navigate to "Study Rooms".
   - Open or join a room; start or pause the shared 25-minute Pomodoro timer.
8. **Admin Panel:**
   - Log in as admin to access "Admin Panel", view registered users, platform statistics, and demonstrate user suspension.
