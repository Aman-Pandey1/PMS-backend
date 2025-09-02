import { api } from '../lib/api.js';

export async function checkIn(lon, lat) {
	const { data } = await api.post('/attendance/check-in', { lon, lat });
	return data;
}

export async function checkOut(report, lon, lat) {
	const { data } = await api.post('/attendance/check-out', { report, lon, lat });
	return data;
}

export async function getMyAttendance() {
	const { data } = await api.get('/attendance/me');
	return data.items;
}

export async function getCompanyAttendance(params = {}) {
	const query = new URLSearchParams(params).toString();
	const { data } = await api.get(`/attendance/company${query ? `?${query}` : ''}`);
	return data.items;
}