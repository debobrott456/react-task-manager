import { useState, useEffect } from 'react';
import { createTask, updateTask } from '../api/tasks';

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed'];

/**
 * Controlled form used for both creating and editing tasks.
 * - When `task` prop is provided, operates in edit mode (calls updateTask).
 * - When `task` is null/undefined, operates in create mode (calls createTask).
 * After a successful create the fields are cleared; after a successful edit
 * `onSave` is called so the parent can close the edit view.
 */
function TaskForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill fields when editing an existing task
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'pending');
    }
  }, [task]);

  const isEditMode = Boolean(task);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { title: title.trim(), description: description.trim(), status };

      if (isEditMode) {
        const updated = await updateTask(task._id, payload);
        onSave(updated);
      } else {
        const created = await createTask(payload);
        onSave(created);
        // Clear fields after successful create
        setTitle('');
        setDescription('');
        setStatus('pending');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label={isEditMode ? 'Edit task' : 'Create task'}>
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

      <div>
        <label htmlFor="task-title">Title *</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={submitting}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : isEditMode ? 'Update Task' : 'Add Task'}
      </button>

      {isEditMode && onCancel && (
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      )}
    </form>
  );
}

export default TaskForm;
