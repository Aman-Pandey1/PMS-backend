import { Request, Response } from 'express';
import argon2 from 'argon2';
import { User } from '../models/User.js';

export async function listUsers(req: Request, res: Response) {
	const { companyId } = req.params as any;
	const isSuper = req.user?.role === 'SUPER_ADMIN';
	const scopeCompanyId = companyId || (!isSuper ? req.user?.companyId : undefined);
	const where = scopeCompanyId ? { companyId: scopeCompanyId } : {};
	const items = await User.find(where).select('-passwordHash').sort({ createdAt: -1 });
	res.json({ items });
}

export async function createUser(req: Request, res: Response) {
	const { email, fullName, password, role, companyId, managerId } = req.body as any;
	if (!email || !fullName || !password || !role) return res.status(400).json({ error: 'missing fields' });
	const passwordHash = await argon2.hash(password);
	const ancestors: any[] = [];
	let depth = 0;
	if (managerId) {
		const manager = await User.findById(managerId);
		if (!manager) return res.status(400).json({ error: 'invalid managerId' });
		ancestors.push(...manager.ancestors, manager._id);
		depth = manager.depth + 1;
	}
	const user = await User.create({ email, fullName, passwordHash, role, companyId, managerId, ancestors, depth });
	res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId, managerId: user.managerId });
}