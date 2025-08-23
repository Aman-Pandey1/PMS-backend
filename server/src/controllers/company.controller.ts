import { Request, Response } from 'express';
import { Company } from '../models/Company.js';

export async function listCompanies(_req: Request, res: Response) {
	const items = await Company.find().sort({ createdAt: -1 });
	res.json({ items });
}

export async function createCompany(req: Request, res: Response) {
	const { name, code } = req.body as { name: string; code: string };
	if (!name || !code) return res.status(400).json({ error: 'name and code required' });
	const exists = await Company.findOne({ code });
	if (exists) return res.status(409).json({ error: 'code already exists' });
	const item = await Company.create({ name, code });
	res.status(201).json(item);
}

export async function getCompany(req: Request, res: Response) {
	const item = await Company.findById(req.params.id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function updateCompany(req: Request, res: Response) {
	const item = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function deleteCompany(req: Request, res: Response) {
	await Company.findByIdAndDelete(req.params.id);
	res.status(204).end();
}