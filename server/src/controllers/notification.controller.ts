import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';

export async function listNotifications(req: Request, res: Response) {
	const items = await Notification.find({ userId: req.user!.uid }).sort({ createdAt: -1 }).limit(50);
	res.json({ items });
}

export async function markRead(req: Request, res: Response) {
	const { id } = req.params;
	const item = await Notification.findOneAndUpdate({ _id: id, userId: req.user!.uid }, { readAt: new Date() }, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}