import { api } from '../lib/api.js';

export async function listUsers(companyId) {
	const qs = companyId ? `?companyId=${companyId}` : '';
	const { data } = await api.get(`/users${qs}`);
	return data.items.map((u) => ({ id: u._id || u.id, email: u.email, fullName: u.fullName, role: u.role, companyId: u.companyId, managerId: u.managerId }));
}