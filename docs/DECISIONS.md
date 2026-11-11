# Decisions and Technical Solutions

Record of technical decisions, rationale, and affected files for the Pathlog application.

---

### 2026-11-11 — Evidence Status Thresholds and Rules
**Context:** Product specification requires 4 deterministic evidence statuses without black-box scores.  
**Decision:**
- **Strong:** Best assessment score >= 75% OR (>= 5 practice logs AND recent accuracy >= 80%).
- **Moderate:** Best assessment score >= 50% OR (>= 3 practice logs AND recent accuracy >= 60%).
- **Limited:** 1-2 practice logs OR best assessment score < 50%.
- **Needs attention:** 0 practice logs and 0 assessments, OR recent accuracy < 50% across 3+ attempts.  
**Why:** Deterministic, easily explainable during viva, and matches cognitive science recall principles.  
**Affected files:** `server/utils/evidence.js`, `server/api.test.js`.

---

### 2026-11-11 — Confidence Persistence & Mismatch Flag
**Context:** Need to persist learner confidence (1-5) and identify discrepancies with evidence without polluting evidence status.  
**Decision:** Store `confidence` (1-5) as a dedicated field on the `Topic` schema. A mismatch flag ("Worth a second look") is computed if confidence >= 4 with weak evidence ('Limited' or 'Needs attention'), or if confidence <= 2 with 'Strong' evidence.  
**Why:** Preserves the core product invariant that self-rated confidence is not evidence of competence.  
**Affected files:** `server/models/Topic.js`, `server/utils/evidence.js`, `src/components/DashboardView.jsx`.

---

### 2026-11-11 — Revision Threshold Override & Zero Practice Topics
**Context:** Standard revision interval is 14 days, but weak evidence requires faster review. How should brand new topics enter the queue?  
**Decision:**
- Topics with 0 practice/assessments are marked "Needs initial practice session" and enter the queue immediately.
- If evidence status is 'Limited' or 'Needs attention', the revision threshold is clamped to 7 days, overriding topic defaults. Otherwise, topic default (14 days) is used.
- Toggling learning resource links does **not** update `lastActivityAt`. Only practice logs or assessments reset `lastActivityAt`.  
**Why:** Directly enforces "Exposure != Competence".  
**Affected files:** `server/utils/evidence.js`, `server/routes/resources.js`, `server/routes/practice.js`.

---

### 2026-11-11 — Priority Tier Ordering for Next Actions
**Context:** Next actions need to guide study focus without arbitrary numeric weighting.  
**Decision:**
- Tier 1 (Urgent): Overdue revision on high-importance (`importance: 3`) topics.
- Tier 2 (Targeted Focus): Overdue revision on other topics OR topics with "Needs attention" evidence.
- Tier 3 (Practice Needed): Topics with completed resources (`resourcesDone > 0`) but zero practice sessions.
- Tier 4 (Next Resource): Topics with incomplete resources.  
**Why:** Clear, transparent, explainable rule hierarchy.  
**Affected files:** `server/utils/evidence.js`, `server/routes/learning.js`.

---

### 2026-11-11 — User Account Suspension Strategy
**Context:** Admin moderation requires account suspension.  
**Decision:** Added `isSuspended: { type: Boolean, default: false }` to `User` schema. `server/middleware/auth.js` checks `user.isSuspended` and rejects requests with `403 Account is suspended`. Socket handshake also rejects suspended users.  
**Why:** Immediate enforcement of admin moderation at both HTTP middleware and WebSocket levels.  
**Affected files:** `server/models/User.js`, `server/middleware/auth.js`, `server/routes/admin.js`, `server/server.js`.
