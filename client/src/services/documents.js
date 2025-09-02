import { api } from '../lib/api.js';

export async function listUserDocuments(userId) {
	const { data } = await api.get(`/documents/user/${userId}`);
	return data.items;
}

export async function uploadUserDocument(userId, { type, file }) {
	const form = new FormData();
	form.append('type', type);
	if (file) form.append('file', file);
	const { data } = await api.post(`/documents/user/${userId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
	return data;
}

export async function listCompanyDocuments(params = {}) {
	const query = new URLSearchParams(params).toString();
	const { data } = await api.get(`/documents/company${query ? `?${query}` : ''}`);
	return data.items;
}

export async function downloadDocument(documentId) {
	// Try blob; handle json URL response as well
	const res = await api.get(`/documents/download/${documentId}`, { responseType: 'blob' });
	const contentType = res.headers['content-type'] || '';
	if (contentType.includes('application/json')) {
		const text = await res.data.text();
		const obj = JSON.parse(text || '{}');
		if (obj.url) {
			const fileRes = await fetch(obj.url);
			return await fileRes.blob();
		}
		throw new Error('Invalid download response');
	}
	return res.data;
}