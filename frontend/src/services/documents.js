import { api } from '../lib/api.js';

export async function listUserDocuments(userId) {
	const { data } = await api.get(`/documents/user/${userId}`);
	return data.items;
}

export async function uploadUserDocument(userId, input) {
	const { data } = await api.post(`/documents/user/${userId}`, input);
	return data;
}