import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

export async function listNotifications(req, res) {
	if (req.user.role === 'SUPER_ADMIN') {
		const items = await Notification.find({}).sort({ createdAt: -1 }).limit(100).lean();
		const userIds = [...new Set(items.map(i => String(i.userId)))];
		const users = await User.find({ _id: { $in: userIds } }).select('fullName email companyId').lean();
		const companyIds = [...new Set(users.map(u => String(u.companyId)).filter(Boolean))];
		const companies = await Company.find({ _id: { $in: companyIds } }).select('name code').lean();
		const userMap = new Map(users.map(u => [String(u._id), u]));
		const companyMap = new Map(companies.map(c => [String(c._id), c]));
		const withUsers = items.map(i => {
			const u = userMap.get(String(i.userId));
			const c = u ? companyMap.get(String(u.companyId)) : null;
			return { ...i, user: u || null, company: c || null };
		});
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