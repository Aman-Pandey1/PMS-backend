import { api } from '../lib/api.js';

export async function loginRequest(email, password) {
	const { data } = await api.post('/auth/login', { email, password });
	return data;
}

export async function meRequest() {
	const { data } = await api.get('/auth/me');
	return data;
}

export async function updateMe(input) {
	const { data } = await api.patch('/auth/me', input);
	return data;
}