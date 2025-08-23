import { api } from '../lib/api';

export type User = { id: string; email: string; fullName: string; role: string; companyId?: string; managerId?: string };

export async function listUsers(companyId?: string) {
	const { data } = await api.get<{ items: any[] }>(`/users${companyId ? `?companyId=${companyId}` : ''}`);
	return data.items.map((u: any) => ({ id: u._id || u.id, email: u.email, fullName: u.fullName, role: u.role, companyId: u.companyId, managerId: u.managerId })) as User[];
}