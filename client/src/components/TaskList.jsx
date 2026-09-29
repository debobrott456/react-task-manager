import TaskItem from './TaskItem';

/**
 * Renders the list of tasks.
 * Shows an empty-state message when there are no tasks.
 */
function TaskList({ tasks, onUpdate, onDelete }) {
  if (!tasks || tasks.length === 0) {
    return <p>No tasks yet. Add one above!</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TaskList;
