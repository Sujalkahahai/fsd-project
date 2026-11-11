import test from 'node:test';
import assert from 'node:assert/strict';
import { server as httpServer, io } from './server.js';
import { once } from 'node:events';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { bootstrapAdminUser, autoSeedTemplates } from './seed.js';
import { io as ClientIO } from 'socket.io-client';

let server;
let base;
let socketPort;

const json = (path, options = {}) => {
  const headers = { 'content-type': 'application/json', ...(options.headers || {}) };
  return fetch(`${base}${path}`, {
    ...options,
    headers,
  });
};

test.before(async () => {
  await connectDB();
  await bootstrapAdminUser();
  await autoSeedTemplates();
  server = httpServer.listen(0);
  await once(server, 'listening');
  socketPort = server.address().port;
  base = `http://localhost:${socketPort}`;
});

test('1. Health check endpoint reports status and database state', async () => {
  const res = await json('/api/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'ok');
  assert.equal(body.data.database, 'connected');
  assert.ok(body.data.service.includes('Pathlog'));
});

test('2. User Registration, duplicate rejection, and role tampering prevention', async () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    name: 'Learner User',
    email: `learner_${uniqueSuffix}@example.com`,
    password: 'SecurePassword123!',
    role: 'admin', // Tamper attempt: must be forced to 'user'
  };

  // Register successfully
  const regRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.equal(regData.success, true);
  assert.ok(regData.token);
  assert.equal(regData.user.name, testUser.name);
  assert.equal(regData.user.email, testUser.email);
  assert.equal(regData.user.role, 'user'); // Role escalation prevented!

  // Duplicate email registration must be rejected with 409
  const dupRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });
  assert.equal(dupRes.status, 409);
});

test('3. Authentication (Login, Bad Credentials, /me endpoint)', async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@pathlog.internal').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'AdminPathlog2026!';

  // Bad credentials -> 401
  const badLogin = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'WrongPassword999!' }),
  });
  assert.equal(badLogin.status, 401);

  // Correct credentials -> 200 with JWT
  const loginRes = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  assert.ok(loginData.token);
  assert.equal(loginData.user.role, 'admin');

  const adminToken = loginData.token;

  // Unauthenticated /api/auth/me -> 401
  const unauthMe = await json('/api/auth/me');
  assert.equal(unauthMe.status, 401);

  // Authenticated /api/auth/me -> 200
  const authMe = await json('/api/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(authMe.status, 200);
  const authMeData = await authMe.json();
  assert.equal(authMeData.user.email, email);
  assert.equal(authMeData.user.role, 'admin');
});

test('4. Subject and Topic CRUD with ownership isolation', async () => {
  // Create user A
  const userARes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'User Alpha',
      email: `alpha_${Date.now()}@example.com`,
      password: 'AlphaPassword123!',
    }),
  });
  const tokenA = (await userARes.json()).token;

  // Create user B
  const userBRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'User Beta',
      email: `beta_${Date.now()}@example.com`,
      password: 'BetaPassword123!',
    }),
  });
  const tokenB = (await userBRes.json()).token;

  // 1. User A creates Subject
  const createSubjRes = await json('/api/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Database Systems',
      why: 'Prepare for midterm examinations',
      targetDate: '2026-12-15',
    }),
  });
  assert.equal(createSubjRes.status, 201);
  const subjA = (await createSubjRes.json()).data;
  assert.equal(subjA.title, 'Database Systems');

  // 2. User B cannot see User A's subject
  const listBRes = await json('/api/subjects', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const listB = (await listBRes.json()).data;
  assert.equal(listB.some((s) => s.id === subjA.id), false);

  // 3. User B cannot add topic to User A's subject
  const unauthorizedTopic = await json('/api/topics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      subjectId: subjA.id,
      title: 'Hacked Topic',
    }),
  });
  assert.equal(unauthorizedTopic.status, 404);

  // 4. User A creates Topic
  const createTopicRes = await json('/api/topics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      subjectId: subjA.id,
      title: 'B-Trees & Indexing',
      importance: 3,
      revisionThresholdDays: 14,
      confidence: 2,
    }),
  });
  assert.equal(createTopicRes.status, 201);
  const topicA = (await createTopicRes.json()).data;
  assert.equal(topicA.title, 'B-Trees & Indexing');
  assert.equal(topicA.confidence, 2);
  assert.equal(topicA.lastActivityAt, null); // Fresh topic has no activity

  // 5. Update Topic confidence
  const updateTopicRes = await json(`/api/topics/${topicA.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ confidence: 4 }),
  });
  assert.equal(updateTopicRes.status, 200);
  const updatedTopic = (await updateTopicRes.json()).data;
  assert.equal(updatedTopic.confidence, 4);
});

test('5. Learning Resources CRUD & Invariant: Toggling done does NOT reset revision clock', async () => {
  const userRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Resource Learner',
      email: `res_${Date.now()}@example.com`,
      password: 'ResPassword123!',
    }),
  });
  const token = (await userRes.json()).token;

  const subjRes = await json('/api/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Web Architecture' }),
  });
  const subj = (await subjRes.json()).data;

  const topicRes = await json('/api/topics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subjectId: subj.id, title: 'HTTP/2 and HTTP/3' }),
  });
  const topic = (await topicRes.json()).data;

  // 1. Add Resource
  const addRes = await json('/api/resources', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topicId: topic.id,
      title: 'HTTP/3 RFC Specification',
      url: 'https://datatracker.ietf.org/doc/html/rfc9114',
      type: 'doc',
    }),
  });
  assert.equal(addRes.status, 201);
  const resource = (await addRes.json()).data;
  assert.equal(resource.done, false);

  // 2. Toggle Resource Done
  const toggleRes = await json(`/api/resources/${resource.id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(toggleRes.status, 200);
  const toggled = (await toggleRes.json()).data;
  assert.equal(toggled.done, true);

  // 3. Verify Product Invariant: lastActivityAt must still be null! (Resource exposure != practice)
  const checkTopicRes = await json(`/api/topics/${topic.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const checkTopic = (await checkTopicRes.json()).data;
  assert.equal(checkTopic.lastActivityAt, null);
  assert.equal(checkTopic.exposureFraction, '1/1');
});

test('6. Practice Session Logging & Invariant: Practice activity resets the revision clock', async () => {
  const userRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Practice Learner',
      email: `prac_${Date.now()}@example.com`,
      password: 'PracPassword123!',
    }),
  });
  const token = (await userRes.json()).token;

  const subjRes = await json('/api/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Algorithms' }),
  });
  const subj = (await subjRes.json()).data;

  const topicRes = await json('/api/topics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subjectId: subj.id, title: 'Dynamic Programming' }),
  });
  const topic = (await topicRes.json()).data;
  assert.equal(topic.lastActivityAt, null);

  // Log a practice attempt
  const practiceRes = await json('/api/practice', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topicId: topic.id,
      correct: true,
      difficulty: 'hard',
      notes: 'Solved 0/1 Knapsack problem successfully',
    }),
  });
  assert.equal(practiceRes.status, 201);
  const practiceLog = (await practiceRes.json()).data;
  assert.equal(practiceLog.correct, true);

  // Verify topic's lastActivityAt was updated to current timestamp!
  const refreshedTopicRes = await json(`/api/topics/${topic.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const refreshedTopic = (await refreshedTopicRes.json()).data;
  assert.ok(refreshedTopic.lastActivityAt !== null);
  assert.equal(refreshedTopic.revision.isDue, false); // Just practiced today, so not due!
});

test('7. Assessments, Score Validation, and Evidence Status calculation', async () => {
  const userRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Assessment Learner',
      email: `asmt_${Date.now()}@example.com`,
      password: 'AsmtPassword123!',
    }),
  });
  const token = (await userRes.json()).token;

  const subjRes = await json('/api/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Computer Networks' }),
  });
  const subj = (await subjRes.json()).data;

  const topicRes = await json('/api/topics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subjectId: subj.id, title: 'TCP/IP Handshake', confidence: 5 }),
  });
  const topic = (await topicRes.json()).data;

  // Invalid score validation (> 100) -> 400
  const invalidScoreRes = await json('/api/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topicId: topic.id,
      score: 150,
    }),
  });
  assert.equal(invalidScoreRes.status, 400);

  // Valid assessment score of 88%
  const validAsmtRes = await json('/api/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topicId: topic.id,
      title: 'Midterm Networking Quiz',
      score: 88,
      noNotesUsed: true,
    }),
  });
  assert.equal(validAsmtRes.status, 201);

  // Check evidence calculation: score >= 75 should yield "Strong" status
  const topicDetailRes = await json(`/api/topics/${topic.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detail = (await topicDetailRes.json()).data;
  assert.equal(detail.evidence.status, 'Strong');
  assert.ok(detail.evidence.reason.includes('88%'));
});

test('8. Revision Queue and Next Actions Dashboard APIs', async () => {
  const userRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dashboard Learner',
      email: `dash_${Date.now()}@example.com`,
      password: 'DashPassword123!',
    }),
  });
  const token = (await userRes.json()).token;

  // Create subject & topic with NO activity (due immediately)
  const subjRes = await json('/api/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Compilers', targetDate: '2026-12-30' }),
  });
  const subj = (await subjRes.json()).data;

  await json('/api/topics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      subjectId: subj.id,
      title: 'Lexical Analysis & DFA',
      importance: 3,
    }),
  });

  // 1. Revision queue should list the unpracticed topic
  const revRes = await json('/api/learning/revision-queue', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(revRes.status, 200);
  const queue = (await revRes.json()).data;
  assert.ok(queue.length > 0);
  assert.equal(queue[0].topicTitle, 'Lexical Analysis & DFA');
  assert.ok(queue[0].reason.includes('initial practice'));

  // 2. Dashboard summary
  const dashRes = await json('/api/learning/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(dashRes.status, 200);
  const dash = (await dashRes.json()).data;
  assert.equal(dash.stats.subjectsCount, 1);
  assert.equal(dash.stats.topicsCount, 1);
  assert.ok(dash.nextActions.length > 0);
});

test('9. Curated Template Browsing and 1-Click Cloning to User Subjects', async () => {
  const userRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Cloner User',
      email: `clone_${Date.now()}@example.com`,
      password: 'ClonePassword123!',
    }),
  });
  const token = (await userRes.json()).token;

  // 1. Fetch available templates
  const tmplRes = await json('/api/templates', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(tmplRes.status, 200);
  const templates = (await tmplRes.json()).data;
  assert.ok(templates.length > 0);
  const starter = templates[0];

  // 2. Clone template into user's subjects
  const cloneRes = await json(`/api/templates/${starter.id || starter._id}/clone`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(cloneRes.status, 201);
  const clonedSubject = (await cloneRes.json()).data;
  assert.equal(clonedSubject.title, starter.title);

  // 3. Verify user's subjects list now contains the cloned subject and topics
  const mySubjRes = await json(`/api/subjects/${clonedSubject.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const mySubj = (await mySubjRes.json()).data;
  assert.ok(mySubj.topics.length > 0);
});

test('10. Socket.IO Real-time User-Scoped Notifications', async () => {
  const userRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Socket Learner',
      email: `sock_${Date.now()}@example.com`,
      password: 'SockPassword123!',
    }),
  });
  const token = (await userRes.json()).token;

  // Connect client socket
  const clientSocket = ClientIO(`http://localhost:${socketPort}`, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token },
  });
  await once(clientSocket, 'connect');
  assert.ok(clientSocket.connected);

  // Wait for notification promise
  const notificationPromise = new Promise((resolve) => {
    clientSocket.on('pathlog:notification', (notif) => {
      resolve(notif);
    });
  });

  // Create a subject via HTTP POST -> triggers notification
  const createSubj = await json('/api/subjects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Real-time WebSockets' }),
  });
  assert.equal(createSubj.status, 201);

  const receivedNotif = await notificationPromise;
  assert.equal(receivedNotif.type, 'subject.created');
  assert.ok(receivedNotif.message.includes('Real-time WebSockets'));

  clientSocket.close();
});

test('11. Admin Moderation & Account Suspension Enforcement', async () => {
  // Login as admin
  const adminLogin = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: (process.env.ADMIN_EMAIL || 'admin@pathlog.internal').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'AdminPathlog2026!',
    }),
  });
  const adminToken = (await adminLogin.json()).token;

  // Register normal user
  const normalUserRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'User To Suspend',
      email: `suspend_${Date.now()}@example.com`,
      password: 'SuspendPassword123!',
    }),
  });
  const normalData = await normalUserRes.json();
  const normalToken = normalData.token;
  const normalUserId = normalData.user.id;

  // 1. Normal user cannot access admin panel (403)
  const forbiddenAdminRes = await json('/api/admin/users', {
    headers: { Authorization: `Bearer ${normalToken}` },
  });
  assert.equal(forbiddenAdminRes.status, 403);

  // 2. Admin suspends normal user
  const suspendRes = await json(`/api/admin/users/${normalUserId}/suspend`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(suspendRes.status, 200);
  assert.equal((await suspendRes.json()).data.isSuspended, true);

  // 3. Suspended user's subsequent requests are rejected with 403
  const rejectedRes = await json('/api/subjects', {
    headers: { Authorization: `Bearer ${normalToken}` },
  });
  assert.equal(rejectedRes.status, 403);
});

test.after(async () => {
  if (io) io.close();
  if (server) server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
