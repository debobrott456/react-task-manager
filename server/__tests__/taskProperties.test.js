/**
 * Property-based tests for the task route handlers.
 * Uses fast-check + supertest against an in-memory MongoDB instance.
 * Each property runs a minimum of 100 iterations.
 */

const request = require('supertest');
const fc = require('fast-check');
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

// ── Arbitraries ────────────────────────────────────────────────────────────────

/** Non-empty, non-whitespace-only string (valid title) */
const validTitleArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/** Optional description string */
const descriptionArb = fc.string({ minLength: 0, maxLength: 100 });

/** Valid status values */
const statusArb = fc.constantFrom('pending', 'in-progress', 'completed');

/** Valid task payload */
const validPayloadArb = fc.record({
  title: validTitleArb,
  description: descriptionArb,
  status: statusArb,
});

// ── Property 1: Task creation persistence (round-trip) ─────────────────────────
// Feature: task-manager, Property 1: Task creation persistence (round-trip)
// Validates: Requirements 1.1, 1.3, 2.2

describe('Property 1: Task creation persistence (round-trip)', () => {
  test(
    'for any valid payload, POST then GET should include a task with matching fields',
    async () => {
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          const createRes = await request(app)
            .post('/api/tasks')
            .send(payload);

          expect(createRes.status).toBe(201);
          const createdId = createRes.body._id;

          const listRes = await request(app).get('/api/tasks');
          expect(listRes.status).toBe(200);

          const found = listRes.body.find((t) => t._id === createdId);
          expect(found).toBeDefined();
          expect(found.title).toBe(payload.title.trim());
          expect(found.status).toBe(payload.status);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ── Property 3: Update reflects in fetch ──────────────────────────────────────
// Feature: task-manager, Property 3: Update reflects in fetch
// Validates: Requirements 3.1, 3.3

describe('Property 3: Update reflects in fetch', () => {
  test(
    'for any existing task and valid update payload, PUT then GET should return updated fields',
    async () => {
      /** Partial update payload — at least one field present */
      const updatePayloadArb = fc.record(
        {
          title: fc.option(validTitleArb, { nil: undefined }),
          description: fc.option(descriptionArb, { nil: undefined }),
          status: fc.option(statusArb, { nil: undefined }),
        },
        { requiredKeys: [] }
      ).filter((p) => Object.keys(p).some((k) => p[k] !== undefined));

      await fc.assert(
        fc.asyncProperty(validPayloadArb, updatePayloadArb, async (initial, update) => {
          // Create the initial task
          const createRes = await request(app).post('/api/tasks').send(initial);
          expect(createRes.status).toBe(201);
          const taskId = createRes.body._id;

          // Apply the update
          const updateRes = await request(app)
            .put(`/api/tasks/${taskId}`)
            .send(update);
          expect(updateRes.status).toBe(200);

          // Fetch all and find the task
          const listRes = await request(app).get('/api/tasks');
          expect(listRes.status).toBe(200);
          const found = listRes.body.find((t) => t._id === taskId);
          expect(found).toBeDefined();

          // Assert updated fields match
          if (update.title !== undefined) {
            expect(found.title).toBe(update.title.trim());
          }
          if (update.status !== undefined) {
            expect(found.status).toBe(update.status);
          }
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ── Property 4: Delete removes task ───────────────────────────────────────────
// Feature: task-manager, Property 4: Delete removes task
// Validates: Requirements 4.1, 4.3

describe('Property 4: Delete removes task', () => {
  test(
    'for any existing task, DELETE then GET should not contain the deleted task',
    async () => {
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          // Create a task
          const createRes = await request(app).post('/api/tasks').send(payload);
          expect(createRes.status).toBe(201);
          const taskId = createRes.body._id;

          // Delete it
          const deleteRes = await request(app).delete(`/api/tasks/${taskId}`);
          expect(deleteRes.status).toBe(200);

          // Fetch all and assert the task is absent
          const listRes = await request(app).get('/api/tasks');
          expect(listRes.status).toBe(200);
          const found = listRes.body.find((t) => t._id === taskId);
          expect(found).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ── Property 5: Non-existent valid ObjectId returns 404 ───────────────────────
// Feature: task-manager, Property 5: Non-existent valid ObjectId returns 404
// Validates: Requirements 3.2, 4.2

/**
 * Arbitrary that generates a new ObjectId hex string each time.
 * These will never collide with IDs inserted in tests because MongoDB
 * ObjectIds encode a timestamp + random component, so freshly generated
 * ones are essentially guaranteed to not exist in the test DB.
 */
const freshObjectIdArb = fc.constant(null).map(() => new ObjectId().toHexString());

describe('Property 5: Non-existent valid ObjectId returns 404', () => {
  test(
    'PUT with a valid-format but non-existent ObjectId should return 404',
    async () => {
      await fc.assert(
        fc.asyncProperty(freshObjectIdArb, async (id) => {
          const res = await request(app)
            .put(`/api/tasks/${id}`)
            .send({ status: 'completed' });
          expect(res.status).toBe(404);
        }),
        { numRuns: 100 }
      );
    }
  );

  test(
    'DELETE with a valid-format but non-existent ObjectId should return 404',
    async () => {
      await fc.assert(
        fc.asyncProperty(freshObjectIdArb, async (id) => {
          const res = await request(app).delete(`/api/tasks/${id}`);
          expect(res.status).toBe(404);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ── Property 6: Malformed ID returns 400 ──────────────────────────────────────
// Feature: task-manager, Property 6: Malformed ID returns 400
// Validates: Requirements 6.2

/**
 * Arbitrary for strings that are NOT valid MongoDB ObjectIds.
 * A valid ObjectId is exactly 24 hex characters.
 * We constrain to URL-safe characters (alphanumeric + common punctuation)
 * to avoid routing issues with slashes, spaces, and control characters.
 * We filter out any strings that happen to be valid ObjectIds.
 */
const { ObjectId: ObjId } = require('mongodb');

function isValidObjectId(id) {
  return ObjId.isValid(id) && String(new ObjId(id)) === id;
}

// Characters that are safe in a URL path segment and won't confuse Express routing
const urlSafeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~!*()';

const malformedIdArb = fc
  .stringOf(fc.constantFrom(...urlSafeChars.split('')), { minLength: 1, maxLength: 40 })
  .filter((s) => !isValidObjectId(s));

describe('Property 6: Malformed ID returns 400', () => {
  test(
    'PUT with a malformed ID should return 400',
    async () => {
      await fc.assert(
        fc.asyncProperty(malformedIdArb, async (id) => {
          const res = await request(app)
            .put(`/api/tasks/${id}`)
            .send({ status: 'completed' });
          expect(res.status).toBe(400);
        }),
        { numRuns: 100 }
      );
    }
  );

  test(
    'DELETE with a malformed ID should return 400',
    async () => {
      await fc.assert(
        fc.asyncProperty(malformedIdArb, async (id) => {
          const res = await request(app).delete(`/api/tasks/${id}`);
          expect(res.status).toBe(400);
        }),
        { numRuns: 100 }
      );
    }
  );
});
