import { api } from '../lib/api.js';

export async function companySummary(companyId) {
	const { data } = await api.get(`/payroll/company/${companyId}/summary`);
	return data;
}

export async function getUserSalary(userId) {
	const { data } = await api.get(`/payroll/user/${userId}/salary`);
	return data.items;
}

export async function setUserSalary(userId, payload) {
	const { data } = await api.post(`/payroll/user/${userId}/salary`, payload);
	return data;
}

export async function computeMonthly(userId, year, month) {
	const { data } = await api.get(`/payroll/user/${userId}/monthly?year=${year}&month=${month}`);
	return data;
}

export async function myLeaveBalance(year, month) {
    const { data } = await api.get(`/payroll/me/leave-balance?year=${year}&month=${month}`);
    return data;
}

export async function myMonthly(year, month) {
	const { data } = await api.get(`/payroll/me/monthly?year=${year}&month=${month}`);
	return data;
}