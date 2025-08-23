import { api } from '../lib/api';

export async function companySummary(companyId: string) {
	const { data } = await api.get<{ total: number; count: number }>(`/payroll/company/${companyId}/summary`);
	return data;
}

export async function getUserSalary(userId: string) {
	const { data } = await api.get<{ items: any[] }>(`/payroll/user/${userId}/salary`);
	return data.items;
}