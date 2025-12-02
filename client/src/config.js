// Auto-detect API URL based on environment
const getApiBaseUrl = () => {
	// If explicitly set via environment variable, use it
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}
	// In production (when deployed), use Render backend URL
	if (import.meta.env.MODE === 'production' || import.meta.env.PROD) {
		return 'https://pms-backend-1-lm1t.onrender.com/api';
	}
	// Default to localhost for development
	return 'http://localhost:4000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const APP_ENV = import.meta.env.MODE || 'development';