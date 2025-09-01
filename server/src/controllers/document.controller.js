import { Request, Response } from 'express';
import { UserDocument } from '../models/Document.js';
import { User } from '../models/User.js';

export async function listUserDocuments(req, res) {
	const { id } = req.params; // user id
	const targetUserId = id === 'me' ? req.user.uid : id;
	if (req.user.role !== 'SUPER_ADMIN' && req.user.uid !== targetUserId) {
		if (req.user.role === 'COMPANY_ADMIN') {
			try {
				const target = await User.findById(targetUserId).select('companyId');
				if (!target || String(target.companyId) !== String(req.user.companyId)) {
					return res.status(403).json({ error: 'Forbidden' });
				}
			} catch {
				return res.status(403).json({ error: 'Forbidden' });
			}
		} else if (req.user.role !== 'SUPER_ADMIN' && req.user.uid !== targetUserId) {
			return res.status(403).json({ error: 'Forbidden' });
		}
	}
	const items = await UserDocument.find({ userId: targetUserId });
	res.json({ items });
}

export async function uploadUserDocument(req, res) {
	const { id } = req.params; // user id
	const targetUserId = id === 'me' ? req.user.uid : id;
	if (req.user.role !== 'SUPER_ADMIN' && req.user.uid !== targetUserId) return res.status(403).json({ error: 'Forbidden' });
	const { type, name } = req.body || {};
	const doc = await UserDocument.create({ userId: targetUserId, companyId: req.user.companyId, type, storage: { provider: 'local', key: name } });
	res.status(201).json(doc);
}