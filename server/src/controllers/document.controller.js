import { UserDocument } from '../models/Document.js';

export async function listUserDocuments(req, res) {
	const { id } = req.params;
	if (req.user.role !== 'SUPER_ADMIN' && req.user.uid !== id) return res.status(403).json({ error: 'Forbidden' });
	const items = await UserDocument.find({ userId: id });
	res.json({ items });
}

export async function uploadUserDocument(req, res) {
	const { id } = req.params;
	if (req.user.role !== 'SUPER_ADMIN' && req.user.uid !== id) return res.status(403).json({ error: 'Forbidden' });
	const { type, name } = req.body || {};
	const doc = await UserDocument.create({ userId: id, companyId: req.user.companyId, type, storage: { provider: 'local', key: name } });
	res.status(201).json(doc);
}