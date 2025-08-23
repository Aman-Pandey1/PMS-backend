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