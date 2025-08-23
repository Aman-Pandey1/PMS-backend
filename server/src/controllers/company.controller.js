import { Company } from '../models/Company.js';

export async function listCompanies(_req, res) {
	const items = await Company.find().sort({ createdAt: -1 });
	res.json({ items });
}

export async function createCompany(req, res) {
	const { name, code, status, address, description } = req.body || {};
	if (!name || !code) return res.status(400).json({ error: 'name and code required' });
	const exists = await Company.findOne({ code });
	if (exists) return res.status(409).json({ error: 'code already exists' });
	const item = await Company.create({ name, code, status, address, description });
	res.status(201).json(item);
}

export async function getCompany(req, res) {
	const item = await Company.findById(req.params.id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function updateCompany(req, res) {
	const item = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function deleteCompany(req, res) {
	await Company.findByIdAndDelete(req.params.id);
	res.status(204).end();
}