import test from 'node:test';
import assert from 'node:assert/strict';
import app from './app.js';
import { once } from 'node:events';
import http from 'node:http';
import mongoose from 'mongoose';
import Event from './models/Event.js';
import connectDB from './config/db.js';

let server;
let base;

const json = (path, options) =>
  fetch(`${base}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });

test.before(async () => {
  await connectDB();
  server = http.createServer(app).listen(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});

test('GET /api/health and /api/events', async () => {
  const healthRes = await json('/api/health');
  assert.equal(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.equal(healthData.data.database, 'connected');

  const eventsRes = await json('/api/events');
  assert.equal(eventsRes.status, 200);
  const eventsData = await eventsRes.json();
  assert.equal(Array.isArray(eventsData.data), true);
});

test('POST, GET by ID, PUT, DELETE lifecycle with MongoDB persistence', async () => {
  const sampleEvent = {
    title: 'Automated Test Event',
    description: 'Verifying MongoDB persistence and Mongoose CRUD operations',
    date: '30 June 2026',
    time: '2:00 PM – 4:00 PM',
    location: 'Navi Mumbai',
    category: 'Showcase',
    tone: 'bg-teal-50 text-teal-700',
  };

  // 1. POST /api/events
  const postRes = await json('/api/events', {
    method: 'POST',
    body: JSON.stringify(sampleEvent),
  });
  assert.equal(postRes.status, 201);
  const postData = await postRes.json();
  assert.equal(postData.success, true);
  const eventId = postData.data.id;
  assert.ok(eventId);

  // Verify direct database query matches
  const dbRecord = await Event.findById(eventId);
  assert.ok(dbRecord);
  assert.equal(dbRecord.title, sampleEvent.title);

  // 2. GET /api/events/:id
  const getRes = await json(`/api/events/${eventId}`);
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.equal(getData.data.id, eventId);
  assert.equal(getData.data.title, sampleEvent.title);

  // 3. PUT /api/events/:id
  const updatedPayload = { ...sampleEvent, title: 'Updated Automated Test Event' };
  const putRes = await json(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedPayload),
  });
  assert.equal(putRes.status, 200);
  const putData = await putRes.json();
  assert.equal(putData.data.title, 'Updated Automated Test Event');

  // Verify database record has been updated
  const updatedDbRecord = await Event.findById(eventId);
  assert.equal(updatedDbRecord.title, 'Updated Automated Test Event');

  // 4. DELETE /api/events/:id
  const deleteRes = await json(`/api/events/${eventId}`, { method: 'DELETE' });
  assert.equal(deleteRes.status, 204);

  // Verify deleted from MongoDB
  const postDeleteDbRecord = await Event.findById(eventId);
  assert.equal(postDeleteDbRecord, null);

  // 5. GET deleted event -> 404
  const getDeletedRes = await json(`/api/events/${eventId}`);
  assert.equal(getDeletedRes.status, 404);
});

test('Validation and error handling', async () => {
  // Invalid ObjectId format
  const badIdRes = await json('/api/events/not-a-valid-object-id');
  assert.equal(badIdRes.status, 400);

  // Non-existent valid ObjectId
  const nonExistentRes = await json('/api/events/507f1f77bcf86cd799439011');
  assert.equal(nonExistentRes.status, 404);

  // Incomplete POST payload
  const badPostRes = await json('/api/events', {
    method: 'POST',
    body: JSON.stringify({ title: 'Missing required fields' }),
  });
  assert.equal(badPostRes.status, 400);

  // Malformed JSON
  const malformedJsonRes = await fetch(`${base}/api/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"unclosed',
  });
  assert.equal(malformedJsonRes.status, 400);
});

test.after(async () => {
  if (server) server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
