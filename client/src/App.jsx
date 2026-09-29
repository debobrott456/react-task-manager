import { useState, useEffect } from 'react';
import { getTasks } from './api/tasks';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    getTasks()
      .then((data) => setTasks(data))
      .catch(() => setError('Failed to load tasks. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = (newTask) => setTasks((prev) => [...prev, newTask]);

  const handleUpdate = (updatedTask) =>
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));

  const handleDelete = (deletedId) =>
    setTasks((prev) => prev.filter((t) => t._id !== deletedId));

  // Counts for navbar badges
  const counts = {
    all:         tasks.length,
    pending:     tasks.filter((t) => t.status === 'pending').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    completed:   tasks.filter((t) => t.status === 'completed').length,
  };

  const filteredTasks =
    activeFilter === 'all' || activeFilter === 'about'
      ? tasks
      : tasks.filter((t) => t.status === activeFilter);

  return (
    <div className="app-wrapper">
      <Navbar activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />

      <main className="main-content">
        {activeFilter === 'about' ? (
          <div className="about-panel">
            <h2>About TaskFlow</h2>
            <p>
              TaskFlow is a full-stack task manager built with <strong>React</strong>,{' '}
              <strong>Express.js</strong>, and <strong>MongoDB</strong>. Create, update, and
              delete tasks with real-time UI updates and persistent cloud storage.
            </p>
            <ul className="about-list">
              <li>📝 Create tasks with title, description, and status</li>
              <li>✏️ Edit tasks inline without leaving the page</li>
              <li>🗑️ Delete tasks with a confirmation prompt</li>
              <li>🔍 Filter by status using the navigation tabs</li>
              <li>☁️ All data persisted in MongoDB Atlas</li>
            </ul>
          </div>
        ) : (
          <>
            <h1>
              {activeFilter === 'all'
                ? 'All Tasks'
                : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1).replace('-', ' ')}
            </h1>

            {activeFilter === 'all' && <TaskForm onSave={handleCreate} />}

            {loading && <p aria-live="polite">Loading tasks…</p>}
            {error && <p role="alert">{error}</p>}

            {!loading && (
              <TaskList
                tasks={filteredTasks}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
