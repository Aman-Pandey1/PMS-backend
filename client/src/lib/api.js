import axios from 'axios';
import { API_BASE_URL } from '../config.js';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
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