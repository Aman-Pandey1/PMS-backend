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
	if (req.user.role === 'COMPANY_ADMIN' || req.user.role === 'SUPERVISOR') {
		const companyUserIds = await User.find({ companyId: req.user.companyId }).select('_id').lean();
		const ids = companyUserIds.map(u => String(u._id));
		const items = await Notification.find({ userId: { $in: ids } }).sort({ createdAt: -1 }).limit(100).lean();
		const users = await User.find({ _id: { $in: ids } }).select('fullName email').lean();
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

export async function getNotification(req, res) {
	const { id } = req.params;
	const n = await Notification.findById(id).lean();
	if (!n) return res.status(404).json({ error: 'Not found' });
	if (req.user.role === 'SUPER_ADMIN') {
		return res.json(n);
	}
	if (req.user.role === 'COMPANY_ADMIN' || req.user.role === 'SUPERVISOR') {
		const u = await User.findById(n.userId).select('companyId').lean();
		if (!u || String(u.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
		return res.json(n);
	}
	if (String(n.userId) !== String(req.user.uid)) return res.status(403).json({ error: 'Forbidden' });
	res.json(n);
}