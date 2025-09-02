import express from 'express';
const Router = express.Router;
import { listCompanies, createCompany, getCompany, updateCompany, deleteCompany } from '../controllers/company.controller.js';
import { uploadLogo, myCompany } from '../controllers/company.uploads.controller.js';
import { Company } from '../models/Company.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/me', myCompany);
r.get('/', requireRoles('SUPER_ADMIN'), listCompanies);
r.post('/', requireRoles('SUPER_ADMIN'), createCompany);
r.get('/:id', requireRoles('SUPER_ADMIN'), getCompany);
r.patch('/:id', requireRoles('SUPER_ADMIN','COMPANY_ADMIN'), updateCompany);
r.delete('/:id', requireRoles('SUPER_ADMIN'), deleteCompany);
// upload logo and toggle status
r.post('/:id/upload-logo', requireRoles('SUPER_ADMIN'), uploadLogo);

// Company Admin can update their own company's geo settings
r.patch('/me/geo', requireRoles('COMPANY_ADMIN'), async (req, res) => {
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'No company' });
	const { allowedGeoZones, allowedGeoCenter, allowedGeoRadiusMeters } = req.body || {};
	const payload = {};
	if (allowedGeoZones !== undefined) payload.allowedGeoZones = allowedGeoZones;
	if (allowedGeoCenter !== undefined) payload.allowedGeoCenter = allowedGeoCenter;
	if (allowedGeoRadiusMeters !== undefined) payload.allowedGeoRadiusMeters = allowedGeoRadiusMeters;
	const updated = await Company.findByIdAndUpdate(companyId, payload, { new: true });
	res.json({ id: updated.id, allowedGeoZones: updated.allowedGeoZones, allowedGeoCenter: updated.allowedGeoCenter, allowedGeoRadiusMeters: updated.allowedGeoRadiusMeters });
});

export default r;