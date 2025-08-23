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