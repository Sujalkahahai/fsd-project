import test from 'node:test';
import assert from 'node:assert/strict';
import app from './app.js';
import { once } from 'node:events';
import http from 'node:http';
import mongoose from 'mongoose';
import Event from './models/Event.js';
import User from './models/User.js';
import connectDB from './config/db.js';
import { autoSeedEvents, bootstrapAdminUser } from './seed.js';

let server;
let base;

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
  server = http.createServer(app).listen(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
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

test.after(async () => {
  if (server) server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
