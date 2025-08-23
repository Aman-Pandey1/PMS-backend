import { api } from '../lib/api.js';

export async function listCompanies() {
	const { data } = await api.get('/companies');
	return data.items.map((c) => ({ ...c, id: c.id || c._id }));
}

export async function createCompany(input) {
	const { data } = await api.post('/companies', input);
	return { ...data, id: data.id || data._id };
}