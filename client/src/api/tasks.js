import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/tasks';

export async function getTasks() {
  const response = await axios.get(API_BASE);
  return response.data;
}

export async function createTask(payload) {
  const response = await axios.post(API_BASE, payload);
  return response.data;
}

export async function updateTask(id, payload) {
  const response = await axios.put(`${API_BASE}/${id}`, payload);
  return response.data;
}

export async function deleteTask(id) {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
}
