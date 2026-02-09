import dayjs from 'dayjs';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

// Shared: point-in-polygon (ray casting)
function pointInPolygon(lon, lat, polygonCoords) {
	let inside = false;
	for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
		const xi = polygonCoords[i][0], yi = polygonCoords[i][1];
		const xj = polygonCoords[j][0], yj = polygonCoords[j][1];
		const intersect = ((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi) / (yj - yi + Number.EPSILON) + xi));
		if (intersect) inside = !inside;
	}
	return inside;
}

/** Returns { allowed, error }. If company location is NOT set → allow from anywhere. If set → allow only when inside. */
function isInsideCompanyGeofence(company, lon, lat) {
	const hasPolys = Array.isArray(company?.allowedGeoZones) && company.allowedGeoZones.length > 0;
	const hasCircle = company?.allowedGeoCenter?.coordinates && company?.allowedGeoRadiusMeters;
	// Jiska location set nahi hai wo kahi se check-in/check-out kar sakta hai
	if (!hasPolys && !hasCircle) {
		return { allowed: true };
	}
	let isInside = false;
	if (hasPolys) {
		isInside = company.allowedGeoZones.some((poly) => {
			try {
				if (poly.type === 'Polygon' && Array.isArray(poly.coordinates) && poly.coordinates[0]) {
					return pointInPolygon(lon, lat, poly.coordinates[0]);
				}
				return false;
			} catch { return false; }
		});
	} else if (hasCircle) {
		try {
			const [clon, clat] = company.allowedGeoCenter.coordinates;
			const toRad = (d) => d * Math.PI / 180;
			const R = 6371000;
			const dLat = toRad(lat - clat);
			const dLon = toRad(lon - clon);
			const a = Math.sin(dLat/2)**2 + Math.cos(toRad(clat)) * Math.cos(toRad(lat)) * Math.sin(dLon/2)**2;
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			const dist = R * c;
			isInside = dist <= company.allowedGeoRadiusMeters;
		} catch { isInside = false; }
	}
	if (!isInside) return { allowed: false, error: 'You are outside the allowed company location. Please be at office to check-in or check-out.' };
	return { allowed: true };
}

export async function checkIn(req, res) {
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { lon, lat } = req.body || {};
	if (lon === undefined || lat === undefined) return res.status(400).json({ error: 'lon/lat required' });
	const date = dayjs().format('YYYY-MM-DD');
	const exists = await Attendance.findOne({ userId, date });
	if (exists) return res.status(409).json({ error: 'Already checked in today' });
	const company = await Company.findById(companyId).lean();
	const geo = isInsideCompanyGeofence(company, lon, lat);
	if (!geo.allowed) return res.status(403).json({ error: geo.error });
	const rec = await Attendance.create({ userId, companyId, date, checkInAt: new Date(), checkInLocation: { type: 'Point', coordinates: [lon, lat] }, dailyReport: { submitted: false }, status: 'OPEN' });
	res.status(201).json(rec);
}

export async function checkOut(req, res) {
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { report, lon, lat, workReport } = req.body || {};
	// Find latest OPEN record (any date) so check-out works even if server date rolled over
	const rec = await Attendance.findOne({ userId, status: 'OPEN' }).sort({ date: -1 });
	if (!rec) return res.status(404).json({ error: 'No open attendance' });
	const reportText = typeof report === 'string' ? report.trim() : '';
	const hasWorkReport = workReport && (workReport.additionalNote?.trim() || (Array.isArray(workReport.tasks) && workReport.tasks.some(t => t && (t.task || t.note))));
	if (!reportText && !hasWorkReport) {
		return res.status(400).json({ error: 'Daily report is required. Please provide a report or work report before checking out.' });
	}
	// Check-out bhi sirf company location se hi allow - same as check-in
	if (lon === undefined || lat === undefined) {
		return res.status(400).json({ error: 'Location (lon/lat) is required for check-out. Please enable location and try again.' });
	}
	const company = await Company.findById(companyId).lean();
	const geo = isInsideCompanyGeofence(company, lon, lat);
	if (!geo.allowed) return res.status(403).json({ error: geo.error });
	rec.dailyReport = {
		submitted: true,
		text: reportText || (workReport?.additionalNote || '').trim() || 'Work report submitted',
		additionalNote: (workReport?.additionalNote || '').trim() || undefined,
		tasks: Array.isArray(workReport?.tasks) ? workReport.tasks.filter(t => t && (t.task || t.note)).map(t => ({ task: String(t.task || ''), note: String(t.note || '') })) : undefined,
	};
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
	if (!['SUPER_ADMIN','COMPANY_ADMIN','SUPERVISOR'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const isSuper = req.user.role === 'SUPER_ADMIN';
	const companyIdParam = req.query.companyId;
	const companyId = isSuper && companyIdParam ? companyIdParam : req.user.companyId;
	if (isSuper && !companyId) return res.status(400).json({ error: 'companyId required' });
	if (!isSuper && !companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { start, end, userId } = req.query || {};
	const where = { companyId };
	if (userId) where.userId = userId;
	if (start || end) {
		where.date = {};
		if (start) where.date.$gte = String(start);
		if (end) where.date.$lte = String(end);
	}
	const items = await Attendance.find(where).sort({ date: -1 }).limit(500).lean();
	const userIds = [...new Set(items.map(i => String(i.userId)))];
	const users = await User.find({ _id: { $in: userIds } }).select('fullName email').lean();
	const map = new Map(users.map(u => [String(u._id), u]));
	const withUsers = items.map(i => ({ ...i, user: map.get(String(i.userId)) || null }));
	res.json({ items: withUsers });
}