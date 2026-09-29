import { useState } from 'react';
import { deleteTask } from '../api/tasks';
import TaskForm from './TaskForm';

/**
 * Renders a single task row.
 * - Shows title, description, status, and createdAt.
 * - Inline edit: toggling edit mode renders a pre-filled TaskForm.
 * - Delete: asks for confirmation before calling the API.
 */
function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = (updatedTask) => {
    setEditing(false);
    onUpdate(updatedTask);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    setError('');
    setDeleting(true);
    try {
      await deleteTask(task._id);
      onDelete(task._id);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete task.');
      setDeleting(false);
    }
  };

  const formattedDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString()
    : '—';

  if (editing) {
    return (
      <li>
        <TaskForm
          task={task}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li data-status={task.status}>
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      <strong>{task.title}</strong>
      {task.description && <p>{task.description}</p>}
      <span>Status: {task.status}</span>
      <span> | Created: {formattedDate}</span>
      <div>
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </li>
  );
}

export default TaskItem;
