import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

export async function requestLeave(req, res) {
	if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'COMPANY_ADMIN') {
		return res.status(403).json({ error: 'Leave application not allowed for admin roles' });
	}
	const userId = req.user.uid;
	const companyId = req.user.companyId;
	if (!companyId) return res.status(400).json({ error: 'User is not associated with a company' });
	const { startDate, endDate, reason } = req.body || {};
	if (!startDate || !endDate || !reason) return res.status(400).json({ error: 'missing fields' });
	const user = await User.findById(userId);
	const approverChain = (user?.ancestors || []).reverse();
	const item = await LeaveRequest.create({ userId, companyId, startDate, endDate, reason, status: 'PENDING', approverChain, currentLevel: 0 });
	// notify manager and company admins
	try {
		const notifyUsers = new Set();
		if (user?.managerId) notifyUsers.add(String(user.managerId));
		const admins = await User.find({ companyId, role: 'COMPANY_ADMIN' }).select('_id');
		admins.forEach(a => notifyUsers.add(String(a._id)));
		await Promise.all(Array.from(notifyUsers).map(uid => Notification.create({ userId: uid, type: 'LEAVE_APPLIED', title: 'Leave request submitted', body: reason?.slice(0,100) || 'Leave request', data: { leaveId: item._id } })));
	} catch {}
	res.status(201).json(item);
}

export async function approveLeave(req, res) {
	if (!['SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const { id } = req.params;
	const item = await LeaveRequest.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	// Fast-path: company-scoped approvers can approve any leave in their company
	if (req.user.role !== 'SUPER_ADMIN') {
		if (String(item.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
		item.approvals.push({ approverId: req.user.uid, status: 'APPROVED', at: new Date() });
		item.status = 'APPROVED';
		await item.save();
		try { await Notification.create({ userId: item.userId, type: 'LEAVE_APPROVED', title: 'Leave approved', body: 'Your leave request is approved', data: { leaveId: item._id } }); } catch {}
		return res.json(item);
	}
	// SUPER_ADMIN
	item.approvals.push({ approverId: req.user.uid, status: 'APPROVED', at: new Date() });
	item.status = 'APPROVED';
	await item.save();
	try { await Notification.create({ userId: item.userId, type: 'LEAVE_APPROVED', title: 'Leave approved', body: 'Your leave request is approved', data: { leaveId: item._id } }); } catch {}
	res.json(item);
}

export async function rejectLeave(req, res) {
	if (!['SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const { id } = req.params;
	const item = await LeaveRequest.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	if (req.user.role !== 'SUPER_ADMIN') {
		if (String(item.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
		item.approvals.push({ approverId: req.user.uid, status: 'REJECTED', at: new Date() });
		item.status = 'REJECTED';
		await item.save();
		try { await Notification.create({ userId: item.userId, type: 'LEAVE_REJECTED', title: 'Leave rejected', body: 'Your leave request was rejected', data: { leaveId: item._id } }); } catch {}
		return res.json(item);
	}
	item.approvals.push({ approverId: req.user.uid, status: 'REJECTED', at: new Date() });
	item.status = 'REJECTED';
	await item.save();
	try { await Notification.create({ userId: item.userId, type: 'LEAVE_REJECTED', title: 'Leave rejected', body: 'Your leave request was rejected', data: { leaveId: item._id } }); } catch {}
	res.json(item);
}

export async function myLeaves(req, res) {
	const userId = req.user.uid;
	const items = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
	res.json({ items });
}

export async function companyLeaves(req, res) {
	if (!['SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	const isSuper = req.user.role === 'SUPER_ADMIN';
	const companyIdParam = req.query.companyId;
	const companyId = isSuper && companyIdParam ? companyIdParam : req.user.companyId;
	if (isSuper && !companyId) return res.status(400).json({ error: 'companyId required' });
	const { status, userId } = req.query || {};
	const where = { companyId };
	if (userId) where.userId = userId;
	if (status) where.status = status;
	const rows = await LeaveRequest.find(where).sort({ createdAt: -1 }).lean();
	const userIds = [...new Set(rows.map(r => String(r.userId)))];
	const users = await User.find({ _id: { $in: userIds } }).select('fullName email').lean();
	const map = new Map(users.map(u => [String(u._id), u]));
	const items = rows.map(r => ({ ...r, user: map.get(String(r.userId)) || null }));
	res.json({ items });
}