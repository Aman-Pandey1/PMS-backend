import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export async function listNotifications(req, res) {
	if (req.user.role === 'SUPER_ADMIN') {
		const items = await Notification.find({}).sort({ createdAt: -1 }).limit(100).lean();
		const userIds = [...new Set(items.map(i => String(i.userId)))];
		const users = await User.find({ _id: { $in: userIds } }).select('fullName email').lean();
		const map = new Map(users.map(u => [String(u._id), u]));
		const withUsers = items.map(i => ({ ...i, user: map.get(String(i.userId)) || null }));
		return res.json({ items: withUsers });
	}
	const items = await Notification.find({ userId: req.user.uid }).sort({ createdAt: -1 }).limit(50);
	res.json({ items });
}

export async function markRead(req, res) {
	const { id } = req.params;
	const item = await Notification.findOneAndUpdate({ _id: id, userId: req.user.uid }, { readAt: new Date() }, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}