import { Request, Response } from 'express';
import { LeaveRequest } from '../models/LeaveRequest.js';

export async function requestLeave(req: Request, res: Response) {
	const userId = req.user!.uid;
	const companyId = req.user!.companyId;
	const { startDate, endDate, reason } = req.body as any;
	if (!startDate || !endDate || !reason) return res.status(400).json({ error: 'missing fields' });
	// Build approver chain from ancestors (closest first)
	const user = await (await import('../models/User.js')).User.findById(userId);
	const approverChain = (user?.ancestors || []).reverse();
	const item = await LeaveRequest.create({ userId, companyId, startDate, endDate, reason, status: 'PENDING', approverChain, currentLevel: 0 });
	res.status(201).json(item);
}

export async function approveLeave(req: Request, res: Response) {
	const { id } = req.params;
	const item = await LeaveRequest.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	const approverId = req.user!.uid;
	// Ensure current approver is in approverChain at currentLevel
	if (String(item.approverChain[item.currentLevel]) !== approverId && req.user!.role !== 'SUPER_ADMIN') {
		return res.status(403).json({ error: 'Not current approver' });
	}
	item.approvals.push({ approverId: approverId as any, status: 'APPROVED', at: new Date() } as any);
	if (item.currentLevel + 1 < item.approverChain.length) {
		item.currentLevel += 1;
	} else {
		item.status = 'APPROVED';
	}
	await item.save();
	res.json(item);
}

export async function rejectLeave(req: Request, res: Response) {
	const { id } = req.params;
	const item = await LeaveRequest.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	const approverId = req.user!.uid;
	if (String(item.approverChain[item.currentLevel]) !== approverId && req.user!.role !== 'SUPER_ADMIN') {
		return res.status(403).json({ error: 'Not current approver' });
	}
	item.approvals.push({ approverId: approverId as any, status: 'REJECTED', at: new Date() } as any);
	item.status = 'REJECTED';
	await item.save();
	res.json(item);
}

export async function myLeaves(req: Request, res: Response) {
	const userId = req.user!.uid;
	const items = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
	res.json({ items });
}