/**
 * Shared test helper: spins up an in-memory MongoDB instance and returns
 * a configured Express app + a teardown function.
 *
 * Uses the native MongoDB driver (same as production code) so that
 * app.locals.db is a real Db instance, not a Mongoose connection.
 */

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const taskRouter = require('../../routes/tasks');

async function createTestApp() {
  const mongoServer = await MongoMemoryServer.create();
  const client = new MongoClient(mongoServer.getUri());
  await client.connect();
  const db = client.db();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.locals.db = db;
  app.use('/api/tasks', taskRouter);

  // Centralized error handler
  app.use((err, req, res, next) => {
    if (err instanceof URIError) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  async function teardown() {
    await client.close();
    await mongoServer.stop();
  }

  return { app, db, teardown };
}

module.exports = { createTestApp };
