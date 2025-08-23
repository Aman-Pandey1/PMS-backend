import { api } from '../lib/api';

export type Company = { id: string; _id?: string; name: string; code: string; status: 'ACTIVE'|'INACTIVE' };

export async function listCompanies() {
	const { data } = await api.get<{ items: Company[] }>('/companies');
	return data.items.map(c => ({ ...c, id: c.id || (c as any)._id }));
}

export async function createCompany(input: { name: string; code: string }) {
	const { data } = await api.post<Company>('/companies', input);
	return { ...data, id: (data as any).id || (data as any)._id };
}