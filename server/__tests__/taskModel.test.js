/**
 * Feature: task-manager, Property 2: Whitespace/empty title rejected
 * Validates: Requirements 1.2
 *
 * Tests that the POST /api/tasks endpoint rejects whitespace-only and empty titles.
 */

const request = require('supertest');
const fc = require('fast-check');
const { createTestApp } = require('./helpers/appHelper');

let app;
let teardown;

beforeAll(async () => {
  ({ app, teardown } = await createTestApp());
});

afterAll(async () => {
  await teardown();
});

describe('Property 2: Whitespace/empty title rejected', () => {
  test('for any whitespace-only or empty title, POST should return 400', async () => {
    const whitespaceArb = fc.oneof(
      fc.constant(''),
      fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
    );

    await fc.assert(
      fc.asyncProperty(whitespaceArb, async (badTitle) => {
        const res = await request(app)
          .post('/api/tasks')
          .send({ title: badTitle });
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});
