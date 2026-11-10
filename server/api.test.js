import test from 'node:test';
import assert from 'node:assert/strict';
import { server as httpServer, io } from './server.js';
import { once } from 'node:events';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { autoSeedEvents, bootstrapAdminUser } from './seed.js';
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
  await autoSeedEvents();
  await bootstrapAdminUser();
  server = httpServer.listen(0);
  await once(server, 'listening');
  socketPort = server.address().port;
  base = `http://localhost:${socketPort}`;
});

test('1. Health check and public event retrieval', async () => {
  const healthRes = await json('/api/health');
  assert.equal(healthRes.status, 200);

  const eventsRes = await json('/api/events');
  assert.equal(eventsRes.status, 200);
  const eventsData = await eventsRes.json();
  assert.equal(Array.isArray(eventsData.data), true);
  assert.ok(eventsData.data.length > 0);
});

test('2. User Registration, duplicate rejection, and role tampering prevention', async () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    name: 'Normal User',
    email: `normaluser_${uniqueSuffix}@example.com`,
    password: 'NormalPassword123!',
    role: 'admin', // Tamper attempt
  };

  // 1. Successful registration
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
  // Role tampering must be prevented: role must be forced to 'user'
  assert.equal(regData.user.role, 'user');
  assert.equal(regData.user.password, undefined);

  // 2. Duplicate registration rejection
  const dupRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });
  assert.equal(dupRes.status, 409);
});

test('3. Authentication (Login, Bad Credentials, /me endpoint)', async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@pathlog.internal').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'AdminPathlog2026!';

  // 1. Login with bad credentials -> 401
  const badLogin = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'WrongPassword123!' }),
  });
  assert.equal(badLogin.status, 401);

  // 2. Login with correct credentials -> 200 with JWT
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

  // 3. Access /api/auth/me without token -> 401
  const noTokenMe = await json('/api/auth/me');
  assert.equal(noTokenMe.status, 401);

  // 4. Access /api/auth/me with invalid token -> 401
  const badTokenMe = await json('/api/auth/me', {
    headers: { Authorization: 'Bearer invalid.token.payload' },
  });
  assert.equal(badTokenMe.status, 401);

  // 5. Access /api/auth/me with valid admin token -> 200
  const validMe = await json('/api/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(validMe.status, 200);
  const validMeData = await validMe.json();
  assert.equal(validMeData.user.email, email);
  assert.equal(validMeData.user.role, 'admin');
});

test('4. Role-based Authorization on Event CRUD (Admin vs Normal User)', async () => {
  // Register a fresh normal user
  const normalEmail = `buyer_${Date.now()}@example.com`;
  const normalReg = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Buyer User',
      email: normalEmail,
      password: 'BuyerPassword123!',
    }),
  });
  const normalToken = (await normalReg.json()).token;

  // Login as admin
  const adminLogin = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: (process.env.ADMIN_EMAIL || 'admin@pathlog.internal').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'AdminPathlog2026!',
    }),
  });
  const adminToken = (await adminLogin.json()).token;

  const sampleEvent = {
    title: 'RBAC Test Event',
    description: 'Testing role authorization',
    date: '10 July 2026',
    time: '10:00 AM - 1:00 PM',
    location: 'Mumbai',
    category: 'Showcase',
  };

  // 1. Unauthenticated POST /api/events -> 401
  const unauthPost = await json('/api/events', {
    method: 'POST',
    body: JSON.stringify(sampleEvent),
  });
  assert.equal(unauthPost.status, 401);

  // 2. Normal user POST /api/events -> 403 Forbidden
  const normalPost = await json('/api/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${normalToken}` },
    body: JSON.stringify(sampleEvent),
  });
  assert.equal(normalPost.status, 403);

  // 3. Admin user POST /api/events -> 201 Created
  const adminPost = await json('/api/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(sampleEvent),
  });
  assert.equal(adminPost.status, 201);
  const createdEvent = (await adminPost.json()).data;
  const eventId = createdEvent.id;

  // 4. Normal user PUT /api/events/:id -> 403 Forbidden
  const normalPut = await json(`/api/events/${eventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${normalToken}` },
    body: JSON.stringify({ ...sampleEvent, title: 'Hacked Title' }),
  });
  assert.equal(normalPut.status, 403);

  // 5. Admin user PUT /api/events/:id -> 200 OK
  const adminPut = await json(`/api/events/${eventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ ...sampleEvent, title: 'Admin Updated Title' }),
  });
  assert.equal(adminPut.status, 200);

  // 6. Normal user DELETE /api/events/:id -> 403 Forbidden
  const normalDelete = await json(`/api/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${normalToken}` },
  });
  assert.equal(normalDelete.status, 403);

  // 7. Admin user DELETE /api/events/:id -> 204 No Content
  const adminDelete = await json(`/api/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminDelete.status, 204);
});

test('5. Socket.IO authentication and real-time user-scoped notifications', async () => {
  // Login as admin to get token
  const adminLoginRes = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: (process.env.ADMIN_EMAIL || 'admin@pathlog.internal').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'AdminPathlog2026!',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  // Create a separate normal user for privacy testing
  const otherUserRes = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Observer User',
      email: `observer_${Date.now()}@example.com`,
      password: 'ObserverPassword123!',
    }),
  });
  const otherUserData = await otherUserRes.json();
  const otherToken = otherUserData.token;

  // A. Rejected without token
  await assert.rejects(
    () =>
      new Promise((resolve, reject) => {
        const badSocket = ClientIO(`http://localhost:${socketPort}`, {
          transports: ['websocket'],
          reconnection: false,
        });
        badSocket.on('connect_error', (err) => {
          badSocket.close();
          reject(err);
        });
        badSocket.on('connect', () => {
          badSocket.close();
          resolve();
        });
      }),
    /Authentication required/
  );

  // B. Rejected with invalid token
  await assert.rejects(
    () =>
      new Promise((resolve, reject) => {
        const badSocket = ClientIO(`http://localhost:${socketPort}`, {
          transports: ['websocket'],
          reconnection: false,
          auth: { token: 'invalid.jwt.token' },
        });
        badSocket.on('connect_error', (err) => {
          badSocket.close();
          reject(err);
        });
        badSocket.on('connect', () => {
          badSocket.close();
          resolve();
        });
      }),
    /Invalid or expired token/
  );

  // C. Connect authenticated admin and authenticated normal user
  const adminSocket = ClientIO(`http://localhost:${socketPort}`, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token: adminToken },
  });
  await once(adminSocket, 'connect');
  assert.ok(adminSocket.connected);

  const otherSocket = ClientIO(`http://localhost:${socketPort}`, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token: otherToken },
  });
  await once(otherSocket, 'connect');
  assert.ok(otherSocket.connected);

  let otherReceivedNotifications = [];
  otherSocket.on('pathlog:notification', (notif) => {
    otherReceivedNotifications.push(notif);
  });

  // D. Admin performs an action (create event) -> triggers notification to admin
  const notificationPromise = new Promise((resolve) => {
    adminSocket.on('pathlog:notification', (notif) => {
      resolve(notif);
    });
  });

  const createRes = await json('/api/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Real-time Socket Workshop',
      description: 'Hands-on practice with WebSockets and Socket.IO.',
      date: '2026-11-20',
      time: '14:00 - 16:00',
      location: 'Lab 305',
      category: 'Workshop',
    }),
  });
  assert.equal(createRes.status, 201);
  const createdEvent = (await createRes.json()).data;

  const receivedNotification = await notificationPromise;
  assert.equal(receivedNotification.type, 'event.created');
  assert.equal(receivedNotification.title, 'Event Created');
  assert.ok(receivedNotification.message.includes('Real-time Socket Workshop'));
  assert.equal(receivedNotification.eventId, createdEvent.id);

  // E. Verify Privacy: other user must NOT have received this private notification
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(otherReceivedNotifications.length, 0);

  // Clean up created event
  await json(`/api/events/${createdEvent.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  adminSocket.close();
  otherSocket.close();
});

test.after(async () => {
  if (io) io.close();
  if (server) server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
