import { api } from '../lib/api';

export async function listUserDocuments(userId: string) {
	const { data } = await api.get<{ items: any[] }>(`/documents/user/${userId}`);
	return data.items;
}

export async function uploadUserDocument(userId: string, input: { type: string; name: string }) {
	const { data } = await api.post(`/documents/user/${userId}`, input);
	return data;
}