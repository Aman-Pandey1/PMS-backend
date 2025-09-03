import { api } from '../lib/api.js';

export async function listCompanies() {
	const { data } = await api.get('/companies');
	return data.items.map((c) => ({ ...c, id: c.id || c._id }));
}

export async function createCompany(input) {
	const { data } = await api.post('/companies', input);
	return { ...data, id: data.id || data._id };
}

export async function uploadCompanyLogo(companyId, file) {
	const form = new FormData();
	form.append('logo', file);
	const { data } = await api.post(`/companies/${companyId || 'new'}/upload-logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
	return data.url;
}

export async function updateCompany(id, patch) {
	const { data } = await api.patch(`/companies/${id}`, patch);
	return data;
}

export async function deleteCompany(id) {
	await api.delete(`/companies/${id}`);
}

export async function toggleCompany(id, enabled) {
	const status = enabled ? 'ACTIVE' : 'INACTIVE';
	const { data } = await api.patch(`/companies/${id}`, { status });
	return data;
}

export async function getMyCompany() {
	const { data } = await api.get('/companies/me');
	return data;
}

export async function updateMyCompanyGeo(payload) {
	const { data } = await api.patch('/companies/me/geo', payload);
	return data;
}

export async function updateMyCompanyLeaveCalendar(payload) {
	const { data } = await api.patch('/companies/me/leave-calendar', payload);
	return data;
}

export async function updateMyCompanyPaidLeavePolicy(paidLeavePolicy) {
	const { data } = await api.patch('/companies/me/paid-leave-policy', { paidLeavePolicy });
	return data;
}