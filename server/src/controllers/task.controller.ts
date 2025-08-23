import { Request, Response } from 'express';
import { Task } from '../models/Task.js';

export async function createTask(req: Request, res: Response) {
	const { assigneeId, description, deadline, priority } = req.body as any;
	// Only allow assigning to direct subordinate
	const { User } = await import('../models/User.js');
	const assignee = await User.findById(assigneeId);
	if (!assignee || String(assignee.managerId) !== req.user!.uid) {
		return res.status(403).json({ error: 'Assignee must be a direct subordinate' });
	}
	const item = await Task.create({ companyId: req.user!.companyId, creatorId: req.user!.uid, assigneeId, description, deadline, priority, status: 'OPEN', updates: [], watchers: assignee.ancestors });
	res.status(201).json(item);
}

export async function myAssignedTasks(req: Request, res: Response) {
	const items = await Task.find({ assigneeId: req.user!.uid }).sort({ createdAt: -1 });
	res.json({ items });
}

export async function myCreatedTasks(req: Request, res: Response) {
	const items = await Task.find({ creatorId: req.user!.uid }).sort({ createdAt: -1 });
	res.json({ items });
}

export async function updateTask(req: Request, res: Response) {
	const { id } = req.params;
	const item = await Task.findByIdAndUpdate(id, req.body, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}