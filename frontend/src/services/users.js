import { api } from '../lib/api.js';

export async function listUsers(companyId) {
	const qs = companyId ? `?companyId=${companyId}` : '';
	const { data } = await api.get(`/users${qs}`);
	return data.items.map((u) => ({ id: u._id || u.id, email: u.email, fullName: u.fullName, role: u.role, companyId: u.companyId, managerId: u.managerId, isActive: u.isActive }));
}

export async function mySubordinates() {
	const { data } = await api.get('/users/my-subordinates');
	return data.items.map((u) => ({ id: u._id || u.id, fullName: u.fullName, email: u.email }));
}

export async function createUser(input) {
	const { data } = await api.post('/users', input);
	return data;
}

export async function searchUsers(q) {
	const { data } = await api.get(`/users?query=${encodeURIComponent(q)}`);
	return data.items.map((u) => ({ id: u._id || u.id, fullName: u.fullName, email: u.email }));
}

export async function setUserActive(id, isActive) {
	const { data } = await api.post(`/users/${id}/active`, { isActive });
	return data;
}

export async function adminSetPassword(id, password) {
	const { data } = await api.post(`/users/${id}/password`, { password });
	return data;
}