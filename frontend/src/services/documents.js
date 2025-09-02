import { api } from '../lib/api.js';

export async function listUserDocuments(userId) {
	const { data } = await api.get(`/documents/user/${userId}`);
	return data.items;
}

export async function uploadUserDocument(userId, input) {
	const { data } = await api.post(`/documents/user/${userId}`, input);
	return data;
}

export async function listCompanyDocuments(params = {}) {
	const query = new URLSearchParams(params).toString();
	const { data } = await api.get(`/documents/company${query ? `?${query}` : ''}`);
	return data.items;
}

export async function downloadDocument(documentId) {
	// For local provider we stream the file. Use blob and trigger download.
	const res = await api.get(`/documents/download/${documentId}`, { responseType: 'blob' });
	return res.data;
}