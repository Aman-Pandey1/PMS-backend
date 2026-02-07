import dayjs from 'dayjs';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

export async function checkIn(req, res) {
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { lon, lat } = req.body || {};
	if (lon === undefined || lat === undefined) return res.status(400).json({ error: 'lon/lat required' });
	const date = dayjs().format('YYYY-MM-DD');
	const exists = await Attendance.findOne({ userId, date });
	if (exists) return res.status(409).json({ error: 'Already checked in today' });
	const user = await User.findById(userId).lean();
	// Company-level geofence: use polygons if defined, else center+radius; fallback to user-level zones
	const company = await Company.findById(companyId).lean();
	const hasPolys = Array.isArray(company?.allowedGeoZones) && company.allowedGeoZones.length > 0;
	const hasCircle = company?.allowedGeoCenter?.coordinates && company?.allowedGeoRadiusMeters;
	
	// If no geofence is set, require it to be set first
	if (!hasPolys && !hasCircle) {
		return res.status(403).json({ error: 'Company location not configured. Please contact administrator.' });
	}
	
	let isInside = false;
	
	// Helper function for point-in-polygon (ray casting algorithm)
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
			const R = 6371000; // Earth radius in meters
			const dLat = toRad(lat - clat);
			const dLon = toRad(lon - clon);
			const a = Math.sin(dLat/2)**2 + Math.cos(toRad(clat)) * Math.cos(toRad(lat)) * Math.sin(dLon/2)**2;
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			const dist = R * c;
			isInside = dist <= company.allowedGeoRadiusMeters;
		} catch { isInside = false; }
	}
	
	// Fallback to user-level zones if company check failed
	if (!isInside && user?.geoAllowedZones && Array.isArray(user.geoAllowedZones) && user.geoAllowedZones.length > 0) {
		isInside = user.geoAllowedZones.some((poly) => {
			try {
				if (poly.type === 'Polygon' && Array.isArray(poly.coordinates) && poly.coordinates[0]) {
					return pointInPolygon(lon, lat, poly.coordinates[0]);
				}
				return false;
			} catch { return false; }
		});
	}
	
	if (!isInside) return res.status(403).json({ error: 'Outside allowed location. Please check-in from the designated company location.' });
	const rec = await Attendance.create({ userId, companyId, date, checkInAt: new Date(), checkInLocation: { type: 'Point', coordinates: [lon, lat] }, dailyReport: { submitted: false }, status: 'OPEN' });
	res.status(201).json(rec);
}

export async function checkOut(req, res) {
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { report, lon, lat } = req.body || {};
	const date = dayjs().format('YYYY-MM-DD');
	const rec = await Attendance.findOne({ userId, date });
	if (!rec) return res.status(404).json({ error: 'No open attendance' });
	// Strict validation: report must be provided and not empty/whitespace only
	if (!report || typeof report !== 'string' || report.trim().length === 0) {
		return res.status(400).json({ error: 'Daily report is required. Please provide a report before checking out.' });
	}
	// Determine if checkout location is outside allowed area; flag if outside but still allow checkout
	let flagged = false;
	
	// Helper function for point-in-polygon (ray casting algorithm)
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
	
	if (lon !== undefined && lat !== undefined) {
		try {
			const company = await Company.findById(companyId).lean();
			const hasPolys = Array.isArray(company?.allowedGeoZones) && company.allowedGeoZones.length > 0;
			const hasCircle = company?.allowedGeoCenter?.coordinates && company?.allowedGeoRadiusMeters;
			let inside = false;
			
			if (hasPolys) {
				inside = company.allowedGeoZones.some((poly) => {
					try {
						if (poly.type === 'Polygon' && Array.isArray(poly.coordinates) && poly.coordinates[0]) {
							return pointInPolygon(lon, lat, poly.coordinates[0]);
						}
						return false;
					} catch { return false; }
				});
			} else if (hasCircle) {
				const [clon, clat] = company.allowedGeoCenter.coordinates;
				const toRad = (d) => d * Math.PI / 180;
				const R = 6371000; // Earth radius in meters
				const dLat = toRad(lat - clat);
				const dLon = toRad(lon - clon);
				const a = Math.sin(dLat/2)**2 + Math.cos(toRad(clat)) * Math.cos(toRad(lat)) * Math.sin(dLon/2)**2;
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
				const dist = R * c;
				inside = dist <= company.allowedGeoRadiusMeters;
			}
			flagged = !inside;
		} catch {}
	}
	rec.dailyReport = { submitted: true, text: report };
	rec.checkOutAt = new Date();
	rec.checkOutLocation = (lon !== undefined && lat !== undefined) ? { type: 'Point', coordinates: [lon, lat] } : rec.checkOutLocation;
	rec.status = flagged ? 'FLAGGED' : 'CLOSED';
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