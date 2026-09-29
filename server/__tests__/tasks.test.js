/**
 * Unit tests for task route handlers.
 * Requirements: 1.2, 3.2, 4.2, 6.1, 6.2
 */

const request = require('supertest');
const { ObjectId } = require('mongodb');
const { createTestApp } = require('./helpers/appHelper');

let app;
let teardown;

beforeAll(async () => {
  ({ app, teardown } = await createTestApp());
});

afterAll(async () => {
  await teardown();
});

// ─── POST /api/tasks ───────────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  test('201 — creates a task with valid title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Buy milk', description: 'Semi-skimmed', status: 'pending' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Buy milk',
      description: 'Semi-skimmed',
      status: 'pending',
    });
    expect(res.body._id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  test('400 — rejects empty title (Requirement 1.2)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('400 — rejects whitespace-only title (Requirement 1.2)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('400 — rejects missing title (Requirement 1.2)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'No title here' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ─── GET /api/tasks ────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  test('200 — returns an array (Requirements: 2.2)', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── PUT /api/tasks/:id ────────────────────────────────────────────────────────

describe('PUT /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to update' });
    taskId = res.body._id;
  });

  test('200 — updates an existing task (Requirement 3.1)', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  test('404 — valid-format ObjectId that does not exist (Requirement 3.2)', async () => {
    const nonExistentId = new ObjectId().toHexString();
    const res = await request(app)
      .put(`/api/tasks/${nonExistentId}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('400 — malformed ObjectId (Requirement 6.2)', async () => {
    const res = await request(app)
      .put('/api/tasks/not-a-valid-id')
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ─── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to delete' });
    taskId = res.body._id;
  });

  test('200 — deletes an existing task (Requirement 4.1)', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('404 — valid-format ObjectId that does not exist (Requirement 4.2)', async () => {
    const nonExistentId = new ObjectId().toHexString();
    const res = await request(app).delete(`/api/tasks/${nonExistentId}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('400 — malformed ObjectId (Requirement 6.2)', async () => {
    const res = await request(app).delete('/api/tasks/not-a-valid-id');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
