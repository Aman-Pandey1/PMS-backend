import { Request, Response } from 'express';
import dayjs from 'dayjs';
import { Attendance } from '../models/Attendance.js';

export async function checkIn(req: Request, res: Response) {
	const userId = req.user!.uid;
	const companyId = req.user!.companyId;
	const { lon, lat } = req.body as { lon: number; lat: number };
	if (lon === undefined || lat === undefined) return res.status(400).json({ error: 'lon/lat required' });
	const date = dayjs().format('YYYY-MM-DD');
	const exists = await Attendance.findOne({ userId, date });
	if (exists) return res.status(409).json({ error: 'Already checked in today' });
	// Geofence validation: ensure within any allowed zone if zones exist
	const user = await (await import('../models/User.js')).User.findById(userId).lean();
	if (user?.geoAllowedZones && user.geoAllowedZones.length > 0) {
		const inside = user.geoAllowedZones.some((poly: any) => {
			try {
				// Simple point-in-polygon using ray casting for Polygon type
				if (poly.type === 'Polygon') {
					const coords: [number, number][] = poly.coordinates[0];
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
	const rec = await Attendance.create({
		userId,
		companyId,
		date,
		checkInAt: new Date(),
		checkInLocation: { type: 'Point', coordinates: [lon, lat] },
		dailyReport: { submitted: false },
		status: 'OPEN',
	});
	res.status(201).json(rec);
}

export async function checkOut(req: Request, res: Response) {
	const userId = req.user!.uid;
	const { report, lon, lat } = req.body as { report: string; lon: number; lat: number };
	const date = dayjs().format('YYYY-MM-DD');
	const rec = await Attendance.findOne({ userId, date });
	if (!rec) return res.status(404).json({ error: 'No open attendance' });
	if (!report) return res.status(400).json({ error: 'Daily report required' });
	rec.dailyReport = { submitted: true, text: report } as any;
	rec.checkOutAt = new Date();
	rec.checkOutLocation = { type: 'Point', coordinates: [lon, lat] } as any;
	rec.status = 'CLOSED';
	await rec.save();
	res.json(rec);
}

export async function myAttendance(_req: Request, res: Response) {
	const userId = res.req.user!.uid;
	const items = await Attendance.find({ userId }).sort({ date: -1 }).limit(30);
	res.json({ items });
}