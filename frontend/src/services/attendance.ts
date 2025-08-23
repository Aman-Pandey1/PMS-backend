import { api } from '../lib/api';

export async function checkIn(lon: number, lat: number) {
	const { data } = await api.post('/attendance/check-in', { lon, lat });
	return data;
}

export async function checkOut(report: string, lon: number, lat: number) {
	const { data } = await api.post('/attendance/check-out', { report, lon, lat });
	return data;
}

export async function getMyAttendance() {
	const { data } = await api.get<{ items: any[] }>('/attendance/me');
	return data.items;
}