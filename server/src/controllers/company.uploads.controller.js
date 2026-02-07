import multer from 'multer';
import path from 'path';
import { Company } from '../models/Company.js';

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, path.resolve(process.cwd(), 'uploads')),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname || '').toLowerCase();
		const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
		cb(null, name);
	},
});
const upload = multer({ storage });

export const uploadLogo = [
	upload.single('logo'),
	async (req, res) => {
		const { id } = req.params;
		if (!req.file) return res.status(400).json({ error: 'No file' });
		const url = `/uploads/${req.file.filename}`;
		if (id && id !== 'new') {
			await Company.findByIdAndUpdate(id, { logo: url });
		}
		res.json({ url });
	}
];

export async function myCompany(req, res) {
	const companyId = req.user.companyId;
	if (!companyId) return res.status(200).json(null);
	const c = await Company.findById(companyId);
	if (!c) return res.status(200).json(null);
	res.json({ id: c.id, name: c.name, code: c.code, status: c.status, logo: c.logo, address: c.address, allowedGeoZones: c.allowedGeoZones, allowedGeoCenter: c.allowedGeoCenter, allowedGeoRadiusMeters: c.allowedGeoRadiusMeters, weeklyOffDays: c.weeklyOffDays || [0], holidayDates: c.holidayDates || [], paidLeavePolicy: c.paidLeavePolicy || [] });
}