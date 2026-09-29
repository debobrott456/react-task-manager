import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import TaskItem from '../components/TaskItem';
import App from '../App';

// Mock the API module
vi.mock('../api/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import { getTasks, createTask } from '../api/tasks';

// ─── TaskForm ─────────────────────────────────────────────────────────────────

describe('TaskForm', () => {
  const noop = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  test('renders title, description, and status fields', () => {
    render(<TaskForm onSave={noop} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  test('status select contains all three options', () => {
    render(<TaskForm onSave={noop} />);

    const select = screen.getByLabelText(/status/i);
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['pending', 'in-progress', 'completed']);
  });

  test('shows validation error when title is empty on submit', async () => {
    render(<TaskForm onSave={noop} />);

    // Submit the form directly to bypass native HTML5 required validation in jsdom
    fireEvent.submit(screen.getByRole('form', { name: /create task/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/title is required/i);
  });

  test('calls createTask and clears fields on successful submit', async () => {
    const newTask = { _id: '1', title: 'New task', description: '', status: 'pending' };
    createTask.mockResolvedValueOnce(newTask);
    const onSave = vi.fn();

    render(<TaskForm onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New task' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(newTask));
    // Input should be cleared after successful create
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });
});

// ─── TaskList ─────────────────────────────────────────────────────────────────

describe('TaskList', () => {
  const noop = vi.fn();

  test('shows empty-state message when tasks array is empty', () => {
    render(<TaskList tasks={[]} onUpdate={noop} onDelete={noop} />);

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  test('shows empty-state message when tasks prop is undefined', () => {
    render(<TaskList onUpdate={noop} onDelete={noop} />);

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  test('renders a list item for each task', () => {
    const tasks = [
      { _id: '1', title: 'Task A', description: '', status: 'pending', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Task B', description: '', status: 'completed', createdAt: new Date().toISOString() },
    ];

    render(<TaskList tasks={tasks} onUpdate={noop} onDelete={noop} />);

    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
  });
});

// ─── TaskItem ─────────────────────────────────────────────────────────────────

describe('TaskItem', () => {
  const baseTask = {
    _id: 'abc123',
    title: 'Buy groceries',
    description: 'Milk and eggs',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00.000Z',
  };
  const noop = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  test('displays title', () => {
    render(<TaskItem task={baseTask} onUpdate={noop} onDelete={noop} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  test('displays description', () => {
    render(<TaskItem task={baseTask} onUpdate={noop} onDelete={noop} />);
    expect(screen.getByText('Milk and eggs')).toBeInTheDocument();
  });

  test('displays status', () => {
    render(<TaskItem task={baseTask} onUpdate={noop} onDelete={noop} />);
    expect(screen.getByText(/status:\s*pending/i)).toBeInTheDocument();
  });

  test('displays formatted createdAt date', () => {
    render(<TaskItem task={baseTask} onUpdate={noop} onDelete={noop} />);
    // The component formats with toLocaleDateString — just check "Created:" label is present
    expect(screen.getByText(/created:/i)).toBeInTheDocument();
  });

  test('shows edit form when Edit button is clicked', () => {
    render(<TaskItem task={baseTask} onUpdate={noop} onDelete={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('form', { name: /edit task/i })).toBeInTheDocument();
  });
});

// ─── App (loading / error states) ────────────────────────────────────────────

describe('App', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows loading indicator while fetching tasks', () => {
    // Never resolves during this test
    getTasks.mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
  });

  test('shows error message when API request fails', async () => {
    getTasks.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load tasks/i);
  });

  test('renders task list after successful fetch', async () => {
    const tasks = [
      { _id: '1', title: 'My task', description: '', status: 'pending', createdAt: new Date().toISOString() },
    ];
    getTasks.mockResolvedValueOnce(tasks);

    render(<App />);

    expect(await screen.findByText('My task')).toBeInTheDocument();
  });
});
