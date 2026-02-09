import axios from 'axios';
import { API_BASE_URL } from '../config.js';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
	// Paths starting with / are treated as origin-absolute, dropping baseURL path (e.g. /api).
	// Strip leading slash so url is relative to baseURL and we hit /api/attendance/... etc.
	if (config.url && typeof config.url === 'string' && config.url.startsWith('/') && !config.url.startsWith('//')) {
		config.url = config.url.slice(1);
	}
	const raw = localStorage.getItem('auth:user');
	if (raw) {
		try {
			const { token } = JSON.parse(raw);
			if (token) {
				config.headers = config.headers || {};
				config.headers.Authorization = `Bearer ${token}`;
			}
		} catch {}
	}
	return config;
});

api.interceptors.response.use(
	(res) => res,
	(err) => {
		const info = {
			url: err.config?.url,
			method: err.config?.method,
			status: err.response?.status,
			data: err.response?.data,
			message: err.message,
		};
		console.error('[API ERROR]', info);
		return Promise.reject(err);
	}
);