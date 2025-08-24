import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';

export async function requestLeave(req, res) {
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { startDate, endDate, reason } = req.body || {};
	if (!startDate || !endDate || !reason) return res.status(400).json({ error: 'missing fields' });
	const user = await User.findById(userId);
	const approverChain = (user?.ancestors || []).reverse();
	const item = await LeaveRequest.create({ userId, companyId, startDate, endDate, reason, status: 'PENDING', approverChain, currentLevel: 0 });
	res.status(201).json(item);
}

export async function approveLeave(req, res) {
	if (!['SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const { id } = req.params;
	const item = await LeaveRequest.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	const approverId = req.user.uid;
	if (String(item.approverChain[item.currentLevel]) !== approverId && req.user.role !== 'SUPER_ADMIN') {
		return res.status(403).json({ error: 'Not current approver' });
	}
	item.approvals.push({ approverId, status: 'APPROVED', at: new Date() });
	if (item.currentLevel + 1 < item.approverChain.length) {
		item.currentLevel += 1;
	} else {
		item.status = 'APPROVED';
	}
	await item.save();
	res.json(item);
}

export async function rejectLeave(req, res) {
	if (!['SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const { id } = req.params;
	const item = await LeaveRequest.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	const approverId = req.user.uid;
	if (String(item.approverChain[item.currentLevel]) !== approverId && req.user.role !== 'SUPER_ADMIN') {
		return res.status(403).json({ error: 'Not current approver' });
	}
	item.approvals.push({ approverId, status: 'REJECTED', at: new Date() });
	item.status = 'REJECTED';
	await item.save();
	res.json(item);
}

export async function myLeaves(req, res) {
	const userId = req.user.uid;
	const items = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
	res.json({ items });
}

export async function companyLeaves(req, res) {
	if (!['SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const companyId = req.user.companyId;
	const { status } = req.query || {};
	const where = { companyId };
	if (status) where.status = status;
	const rows = await LeaveRequest.find(where).sort({ createdAt: -1 }).lean();
	const userIds = [...new Set(rows.map(r => String(r.userId)))];
	const users = await User.find({ _id: { $in: userIds } }).select('fullName email').lean();
	const map = new Map(users.map(u => [String(u._id), u]));
	const items = rows.map(r => ({ ...r, user: map.get(String(r.userId)) || null }));
	res.json({ items });
}