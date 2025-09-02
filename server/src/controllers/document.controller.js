import express from 'express';
// Removed invalid type import from express; types not used in JS
import fs from 'fs';
import path from 'path';
import { UserDocument } from '../models/Document.js';
import { User } from '../models/User.js';

export async function listUserDocuments(req, res) {
	const { id } = req.params; // user id
	const targetUserId = id === 'me' ? req.user.uid : id;
	// Allow SUPER_ADMIN, COMPANY_ADMIN (same company), or the user themselves
	if (req.user.role === 'COMPANY_ADMIN' && targetUserId !== req.user.uid) {
		const target = await User.findById(targetUserId).select('companyId');
		if (!target || String(target.companyId) !== String(req.user.companyId)) {
			return res.status(403).json({ error: 'Forbidden' });
		}
	} else if (req.user.role !== 'SUPER_ADMIN' && req.user.uid !== targetUserId) {
		return res.status(403).json({ error: 'Forbidden' });
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

export async function listCompanyDocuments(req, res) {
	if (!['SUPER_ADMIN','COMPANY_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const isSuper = req.user.role === 'SUPER_ADMIN';
	const { companyId: companyIdParam, userId } = req.query || {};
	const companyId = isSuper ? companyIdParam : req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'companyId required' });
	const where = { companyId };
	if (userId) where.userId = userId;
	const items = await UserDocument.find(where).sort({ createdAt: -1 });
	res.json({ items });
}

export async function downloadDocument(req, res) {
	const { id } = req.params; // document id
	const doc = await UserDocument.findById(id);
	if (!doc) return res.status(404).json({ error: 'Not found' });
	// Authorization: SUPER_ADMIN or COMPANY_ADMIN of same company or owner
	if (req.user.role === 'COMPANY_ADMIN') {
		if (String(doc.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
	} else if (req.user.role !== 'SUPER_ADMIN' && String(doc.userId) !== String(req.user.uid)) {
		return res.status(403).json({ error: 'Forbidden' });
	}
	// Local storage provider - stream file from uploads path using storage.key
	if (doc.storage?.provider === 'local') {
		const uploadDir = path.resolve(process.cwd(), 'uploads');
		const filePath = path.join(uploadDir, doc.storage.key);
		if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
		res.setHeader('Content-Disposition', `attachment; filename="${path.basename(doc.storage.key)}"`);
		return fs.createReadStream(filePath).pipe(res);
	}
	// For other providers, return a pre-signed URL if available
	if (doc.storage?.url) {
		return res.json({ url: doc.storage.url });
	}
	return res.status(500).json({ error: 'Storage provider not supported' });
}