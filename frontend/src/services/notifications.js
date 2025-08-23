import { api } from '../lib/api.js';

export async function listNotifications() {
	const { data } = await api.get('/notifications');
	return data.items;
}

export async function markNotificationRead(id) {
	const { data } = await api.patch(`/notifications/${id}/read`);
	return data;
}