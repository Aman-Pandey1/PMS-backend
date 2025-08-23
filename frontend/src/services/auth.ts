import { api } from '../lib/api';

type LoginResponse = {
	user: { id: string; email: string; fullName: string; role: 'SUPER_ADMIN'|'COMPANY_ADMIN'|'SUPERVISOR'|'EMPLOYEE'; companyId?: string };
	token: string;
};

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
	const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
	return data;
}

export async function meRequest(): Promise<LoginResponse['user']> {
	const { data } = await api.get<LoginResponse['user']>('/auth/me');
	return data as any;
}