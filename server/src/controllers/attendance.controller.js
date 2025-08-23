import dayjs from 'dayjs';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';

export async function checkIn(req, res) {
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	const { lon, lat } = req.body || {};
	if (lon === undefined || lat === undefined) return res.status(400).json({ error: 'lon/lat required' });
	const date = dayjs().format('YYYY-MM-DD');
	const exists = await Attendance.findOne({ userId, date });
	if (exists) return res.status(409).json({ error: 'Already checked in today' });
	const user = await User.findById(userId).lean();
	if (user?.geoAllowedZones && user.geoAllowedZones.length > 0) {
		const inside = user.geoAllowedZones.some((poly) => {
			try {
				if (poly.type === 'Polygon') {
					const coords = poly.coordinates[0];
					let c = false;
					for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
						const xi = coords[i][0], yi = coords[i][1];
						const xj = coords[j][0], yj = coords[j][1];
						const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi + Number.EPSILON) + xi);
						if (intersect) c = !c;
					}
					return c;
				}
				return false;
			} catch { return false; }
		});
		if (!inside) return res.status(403).json({ error: 'Outside allowed location' });
	}
	const rec = await Attendance.create({ userId, companyId, date, checkInAt: new Date(), checkInLocation: { type: 'Point', coordinates: [lon, lat] }, dailyReport: { submitted: false }, status: 'OPEN' });
	res.status(201).json(rec);
}

export async function checkOut(req, res) {
	const userId = req.user.uid;
	const { report, lon, lat } = req.body || {};
	const date = dayjs().format('YYYY-MM-DD');
	const rec = await Attendance.findOne({ userId, date });
	if (!rec) return res.status(404).json({ error: 'No open attendance' });
	if (!report) return res.status(400).json({ error: 'Daily report required' });
	rec.dailyReport = { submitted: true, text: report };
	rec.checkOutAt = new Date();
	rec.checkOutLocation = { type: 'Point', coordinates: [lon, lat] };
	rec.status = 'CLOSED';
	await rec.save();
	res.json(rec);
}

export async function myAttendance(_req, res) {
	const userId = res.req.user.uid;
	const items = await Attendance.find({ userId }).sort({ date: -1 }).limit(30);
	res.json({ items });
}

export async function companyAttendance(req, res) {
	const isSuper = req.user.role === 'SUPER_ADMIN';
	const companyIdParam = req.query.companyId;
	const companyId = isSuper && companyIdParam ? companyIdParam : req.user.companyId;
	const { start, end, userId } = req.query || {};
	const where = { companyId };
	if (userId) where.userId = userId;
	if (start || end) {
		where.date = {};
		if (start) where.date.$gte = String(start);
		if (end) where.date.$lte = String(end);
	}
	const items = await Attendance.find(where).sort({ date: -1 }).limit(500);
	res.json({ items });
}