import { Request, Response } from 'express';
import { LeaveRequest } from '../models/LeaveRequest.js';

export async function requestLeave(req: Request, res: Response) {
	const userId = req.user!.uid;
	const companyId = req.user!.companyId;
	const { startDate, endDate, reason } = req.body as any;
	if (!startDate || !endDate || !reason) return res.status(400).json({ error: 'missing fields' });
	const item = await LeaveRequest.create({ userId, companyId, startDate, endDate, reason, status: 'PENDING', approverChain: [], currentLevel: 0 });
	res.status(201).json(item);
}

export async function approveLeave(req: Request, res: Response) {
	const { id } = req.params;
	const item = await LeaveRequest.findByIdAndUpdate(id, { status: 'APPROVED' }, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function rejectLeave(req: Request, res: Response) {
	const { id } = req.params;
	const item = await LeaveRequest.findByIdAndUpdate(id, { status: 'REJECTED' }, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function myLeaves(req: Request, res: Response) {
	const userId = req.user!.uid;
	const items = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
	res.json({ items });
}