import { api } from '../lib/api';

export async function requestLeave(input: { startDate: string; endDate: string; reason: string }) {
	const { data } = await api.post('/leaves', input);
	return data;
}

export async function myLeaves() {
	const { data } = await api.get<{ items: any[] }>('/leaves/me');
	return data.items;
}

export async function approveLeave(id: string) {
	const { data } = await api.post(`/leaves/${id}/approve`);
	return data;
}

export async function rejectLeave(id: string) {
	const { data } = await api.post(`/leaves/${id}/reject`);
	return data;
}