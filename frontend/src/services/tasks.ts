import { api } from '../lib/api';

export async function createTask(input: { assigneeId: string; description: string; deadline?: string; priority?: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' }) {
	const { data } = await api.post('/tasks', input);
	return data;
}

export async function tasksAssignedToMe() {
	const { data } = await api.get<{ items: any[] }>('/tasks/assigned-to-me');
	return data.items;
}

export async function tasksCreatedByMe() {
	const { data } = await api.get<{ items: any[] }>('/tasks/created-by-me');
	return data.items;
}

export async function updateTask(id: string, patch: any) {
	const { data } = await api.patch(`/tasks/${id}`, patch);
	return data;
}