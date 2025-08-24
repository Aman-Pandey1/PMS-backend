import argon2 from 'argon2';
import crypto from 'crypto';
import { User } from '../models/User.js';

const resetTokens = new Map(); // email -> { token, expiresAt }

export async function setUserActive(req, res) {
	const { id } = req.params;
	const { isActive } = req.body || {};
	if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive boolean required' });
	// Company Admin can only manage within their company
	if (req.user.role === 'COMPANY_ADMIN') {
		const target = await User.findById(id);
		if (!target || String(target.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
	}
	const updated = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select('-passwordHash');
	if (!updated) return res.status(404).json({ error: 'Not found' });
	res.json(updated);
}

export async function adminSetPassword(req, res) {
	const { id } = req.params;
	const { password } = req.body || {};
	if (!password || password.length < 4) return res.status(400).json({ error: 'Password min 4 chars' });
	if (req.user.role === 'COMPANY_ADMIN') {
		const target = await User.findById(id);
		if (!target || String(target.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
	}
	const passwordHash = await argon2.hash(password);
	await User.findByIdAndUpdate(id, { passwordHash });
	res.json({ ok: true });
}

export async function requestPasswordReset(req, res) {
	const { email } = req.body || {};
	if (!email) return res.status(400).json({ error: 'email required' });
	const user = await User.findOne({ email });
	if (!user) return res.json({ ok: true }); // don't leak
	const token = crypto.randomBytes(16).toString('hex');
	resetTokens.set(email, { token, expiresAt: Date.now() + 1000 * 60 * 15 });
	// In a real app, send email. For now, return token for testing.
	res.json({ ok: true, token });
}

export async function performPasswordReset(req, res) {
	const { email, token, password } = req.body || {};
	if (!email || !token || !password) return res.status(400).json({ error: 'email, token, password required' });
	const entry = resetTokens.get(email);
	if (!entry || entry.token !== token || entry.expiresAt < Date.now()) return res.status(400).json({ error: 'Invalid or expired token' });
	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ error: 'Not found' });
	const passwordHash = await argon2.hash(password);
	user.passwordHash = passwordHash;
	await user.save();
	resetTokens.delete(email);
	res.json({ ok: true });
}