import { api } from '../lib/api.js';

export async function checkIn(lon, lat) {
	const { data } = await api.post('/attendance/check-in', { lon, lat });
	return data;
}

export async function checkOut(report, lon, lat, workReport = null) {
	const body = { report: report || '', lon, lat };
	if (workReport && (workReport.additionalNote || (workReport.tasks && workReport.tasks.length))) body.workReport = workReport;
	const { data } = await api.post('/attendance/check-out', body);
	return data;
}

export async function getMyAttendance() {
	try {
		const { data } = await api.get('/attendance/me');
		return data?.items ?? [];
	} catch {
		return [];
	}
}

export async function getCompanyAttendance(params = {}) {
	try {
		const query = new URLSearchParams(params).toString();
		const { data } = await api.get(`/attendance/company${query ? `?${query}` : ''}`);
		return data?.items ?? [];
	} catch {
		return [];
	}
}