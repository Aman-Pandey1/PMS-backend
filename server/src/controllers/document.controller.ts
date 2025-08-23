import { Request, Response } from 'express';
import { UserDocument } from '../models/Document.js';

export async function listUserDocuments(req: Request, res: Response) {
	const { id } = req.params; // user id
	if (req.user!.role !== 'SUPER_ADMIN' && req.user!.uid !== id) return res.status(403).json({ error: 'Forbidden' });
	const items = await UserDocument.find({ userId: id });
	res.json({ items });
}

export async function uploadUserDocument(req: Request, res: Response) {
	const { id } = req.params; // user id
	if (req.user!.role !== 'SUPER_ADMIN' && req.user!.uid !== id) return res.status(403).json({ error: 'Forbidden' });
	const { type, name } = req.body as any;
	const doc = await UserDocument.create({ userId: id, companyId: req.user!.companyId!, type, storage: { provider: 'local', key: name } });
	res.status(201).json(doc);
}