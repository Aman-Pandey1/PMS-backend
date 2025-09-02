import { api } from '../lib/api.js';

export async function requestLeave(input) {
	const { data } = await api.post('/leaves', input);
	return data;
}

export async function myLeaves() {
	const { data } = await api.get('/leaves/me');
	return data.items;
}

export async function companyLeaves(params = {}) {
	const query = new URLSearchParams(params).toString();
	const { data } = await api.get(`/leaves/company${query ? `?${query}` : ''}`);
	return data.items;
}

export async function approveLeave(id) {
	const { data } = await api.post(`/leaves/${id}/approve`);
	return data;
}

export async function rejectLeave(id) {
	const { data } = await api.post(`/leaves/${id}/reject`);
	return data;
}