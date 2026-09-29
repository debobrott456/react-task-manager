const express = require('express');
const { ObjectId } = require('mongodb');
const { getTaskCollection } = require('../models/Task');

const router = express.Router();

/**
 * Checks whether a string is a valid MongoDB ObjectId format.
 */
function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

// GET / — return all tasks (Requirements: 2.2)
router.get('/', async (req, res, next) => {
  try {
    const collection = getTaskCollection(req.app.locals.db);
    const tasks = await collection.find({}).toArray();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST / — create a task (Requirements: 1.1, 1.2, 1.3)
router.post('/', async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    // Validate title is non-empty after trim (Requirement 1.2)
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
    const newTask = {
      title: title.trim(),
      description: description ? description.trim() : '',
      status: VALID_STATUSES.includes(status) ? status : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = getTaskCollection(req.app.locals.db);
    const result = await collection.insertOne(newTask);
    res.status(201).json({ ...newTask, _id: result.insertedId });
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update a task (Requirements: 3.1, 3.2, 6.2)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Return 400 for malformed ObjectId (Requirement 6.2)
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const { title, description, status } = req.body;
    const updates = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;

    const collection = getTaskCollection(req.app.locals.db);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    // Return 404 if task not found (Requirement 3.2)
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete a task (Requirements: 4.1, 4.2, 6.2)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Return 400 for malformed ObjectId (Requirement 6.2)
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const collection = getTaskCollection(req.app.locals.db);
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });

    // Return 404 if task not found (Requirement 4.2)
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
