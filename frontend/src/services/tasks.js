import { api } from '../lib/api.js';

export async function createTask(input) {
	const { data } = await api.post('/tasks', input);
	return data;
}

export async function tasksAssignedToMe() {
	const { data } = await api.get('/tasks/assigned-to-me');
	return data.items;
}

export async function tasksCreatedByMe() {
	const { data } = await api.get('/tasks/created-by-me');
	return data.items;
}

export async function updateTask(id, patch) {
	const { data } = await api.patch(`/tasks/${id}`, patch);
	return data;
}

export async function getTask(id) {
	const { data } = await api.get(`/tasks/${id}`);
	return data;
}

export async function addTaskUpdate(id, input) {
	const payload = typeof input === 'string' ? { text: input } : (input || {});
	const { data } = await api.post(`/tasks/${id}/updates`, payload);
	return data;
}

export async function filterTasks(params = {}) {
	const query = new URLSearchParams(params).toString();
	const { data } = await api.get(`/tasks/filter${query ? `?${query}` : ''}`);
	return data.items;
}