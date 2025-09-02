import { Company } from '../models/Company.js';

export async function listCompanies(_req, res) {
	const items = await Company.find().sort({ createdAt: -1 });
	res.json({ items });
}

export async function createCompany(req, res) {
	const { name, code, status, address, description, logo, adminEmail, adminPassword, adminName } = req.body || {};
	if (!name || !code) return res.status(400).json({ error: 'name and code required' });
	const exists = await Company.findOne({ code });
	if (exists) return res.status(409).json({ error: 'code already exists' });
	const company = await Company.create({ name, code, status, address, description, logo });
	let adminUser = null;
	if (adminEmail && adminPassword) {
		const argon2 = await import('argon2');
		const passwordHash = await argon2.default.hash(adminPassword);
		const { User } = await import('../models/User.js');
		adminUser = await User.create({ email: adminEmail.trim(), passwordHash, fullName: adminName || `${name} Admin`, role: 'COMPANY_ADMIN', companyId: company._id });
	}
	res.status(201).json({ company, adminUser });
}

export async function getCompany(req, res) {
	const item = await Company.findById(req.params.id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function updateCompany(req, res) {
	const { id } = req.params;
	const body = req.body || {};
	if (req.user.role === 'COMPANY_ADMIN') {
		if (String(req.user.companyId) !== String(id)) return res.status(403).json({ error: 'Forbidden' });
		const patch = {};
		if (body.address) patch.address = body.address;
		if (body.geofenceCenter) patch.geofenceCenter = body.geofenceCenter;
		if (typeof body.geofenceRadiusMeters === 'number') patch.geofenceRadiusMeters = body.geofenceRadiusMeters;
		const updated = await Company.findByIdAndUpdate(id, patch, { new: true });
		if (!updated) return res.status(404).json({ error: 'Not found' });
		return res.json(updated);
	}
	const item = await Company.findByIdAndUpdate(id, body, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function deleteCompany(req, res) {
	await Company.findByIdAndDelete(req.params.id);
	res.status(204).end();
}