import argon2 from 'argon2';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { signJwt } from '../utils/jwt.js';

export async function login(req, res) {
	const { email, password } = req.body || {};
	if (!email || !password) return res.status(400).json({ error: 'email and password required' });
	let user = await User.findOne({ email });
	if (!user) {
		const anyUser = await User.exists({});
		if (!anyUser) {
			const passwordHash = await argon2.hash(password);
			user = await User.create({ email, passwordHash, fullName: 'Super Admin', role: 'SUPER_ADMIN' });
		} else {
			return res.status(401).json({ error: 'Invalid credentials' });
		}
	}
	const ok = await argon2.verify(user.passwordHash, password);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
	if (user.role !== 'SUPER_ADMIN' && user.isActive === false) return res.status(403).json({ error: 'User is inactive. Contact administrator.' });
	if (user.role !== 'SUPER_ADMIN' && user.companyId) {
		const c = await Company.findById(user.companyId).select('status name');
		if (c && c.status === 'INACTIVE') return res.status(403).json({ error: 'Company is disabled. Contact administrator.' });
	}
	const token = signJwt({ uid: String(user._id), role: user.role, companyId: user.companyId ? String(user.companyId) : undefined });
	return res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId }, token });
}

export async function me(req, res) {
	const userId = req.user?.uid;
	if (!userId) return res.status(401).json({ error: 'Unauthorized' });
	const user = await User.findById(userId);
	if (!user) return res.status(404).json({ error: 'Not found' });
	return res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId });
}

export async function updateMe(req, res) {
	const userId = req.user?.uid;
	if (!userId) return res.status(401).json({ error: 'Unauthorized' });
	const { email, fullName, password } = req.body || {};
	const patch = {};
	if (email) patch.email = String(email).trim();
	if (fullName) patch.fullName = String(fullName).trim();
	if (password) {
		if (String(password).length < 4) return res.status(400).json({ error: 'Password min 4 chars' });
		const passwordHash = await argon2.hash(String(password));
		patch.passwordHash = passwordHash;
	}
	try {
		const updated = await User.findByIdAndUpdate(userId, patch, { new: true });
		if (!updated) return res.status(404).json({ error: 'Not found' });
		return res.json({ id: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role, companyId: updated.companyId });
	} catch (e) {
		if (e?.code === 11000) return res.status(409).json({ error: 'Email already in use' });
		return res.status(400).json({ error: 'Invalid update' });
	}
}