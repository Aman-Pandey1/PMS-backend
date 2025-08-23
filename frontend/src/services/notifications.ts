import { api } from '../lib/api';

export async function listNotifications() {
	const { data } = await api.get<{ items: any[] }>('/notifications');
	return data.items;
}

export async function markNotificationRead(id: string) {
	const { data } = await api.patch(`/notifications/${id}/read`);
	return data;
}