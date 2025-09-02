import { api } from '../lib/api.js';

export async function companySummary(companyId) {
	const { data } = await api.get(`/payroll/company/${companyId}/summary`);
	return data;
}

export async function getUserSalary(userId) {
	const { data } = await api.get(`/payroll/user/${userId}/salary`);
	return data.items;
}