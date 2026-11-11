# Incremental FSD Lab Roadmap

**Basis:** Pathlog Web Application Design and Planning baseline for Full Stack Development Mini Project & Lab Evaluation.

| Phase | Proposed increment | State |
|---|---|---|
| 0 | Problem analysis, target users, requirements, views, wireframes, stack and DB design | Completed (PDF Baseline) |
| 1 | React + Vite + Tailwind scaffold; responsive shell, navigation, initial pages | Completed (`src/App.jsx`, `src/components/Navbar.jsx`, `src/styles.css`) |
| 2 | Subject/topic UI, forms, state, validation and routing | Completed (`src/components/SubjectsView.jsx`, `src/components/TopicDetailModal.jsx`) |
| 3 | Express server, MongoDB connection and core CRUD | Completed (`server/routes/subjects.js`, `server/routes/topics.js`) |
| 4 | JWT authentication, protected routes, ownership and roles | Completed (`server/middleware/auth.js`, `server/routes/auth.js`) |
| 5 | Resource exposure, practice logs and assessment CRUD | Completed (`server/routes/resources.js`, `server/routes/practice.js`, `server/routes/assessments.js`) |
| 6 | Deterministic evidence engine and independent confidence | Completed (`server/utils/evidence.js`) |
| 7 | Revision queue and explainable priority engine | Completed (`server/routes/learning.js`, `src/components/RevisionQueueView.jsx`) |
| 8 | Template publishing and cloning; admin moderation | Completed (`server/routes/templates.js`, `server/routes/admin.js`, `src/components/TemplatesView.jsx`, `src/components/AdminView.jsx`) |
| 9 | Socket.IO study room, shared timer and activity feed | Completed (`server/server.js`, `src/components/StudyRoomView.jsx`, `src/context/NotificationContext.jsx`) |
| 10 | Tests, Docker containerization, deployment and final integration | Completed (`server/api.test.js` 11/11 tests pass, `Dockerfile`, `docker-compose.yml`, `dist/` production bundle) |

---

## Verification & Status
- **Automated test suite:** `npm run test:api` passes 11/11 tests covering all REST endpoints, invariant logic, Socket.IO rooms, and RBAC.
- **Production bundle:** `npm run build` compiles Vite assets cleanly into `dist/` with 0 warnings.
- **Linter check:** `npm run lint` passes with 0 errors and 0 warnings.
