require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const taskRouter = require('./routes/tasks');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();
    console.log('Connected to MongoDB');

    // Attach db to app so routes can access it
    app.locals.db = db;

    // Routes (mounted after db is available)
    app.use('/api/tasks', taskRouter);

    // Centralized error-handling middleware (4-arg)
    app.use((err, req, res, next) => {
      if (err instanceof URIError) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }
      console.error(err.stack);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
