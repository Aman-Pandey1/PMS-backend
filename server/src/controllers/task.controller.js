import { Task } from '../models/Task.js';
import { User } from '../models/User.js';

export async function createTask(req, res) {
	const { assigneeId, description, deadline, priority, projectName, startDate, remarks } = req.body || {};
	// Only allow assigning: company admin to any in company; supervisor to direct subordinate
	if (req.user.role === 'SUPERVISOR') {
		const assignee = await User.findById(assigneeId);
		if (!assignee || String(assignee.managerId) !== req.user.uid) {
			return res.status(403).json({ error: 'Assignee must be a direct subordinate' });
		}
	}
	if (req.user.role === 'COMPANY_ADMIN') {
		const assignee = await User.findById(assigneeId);
		if (!assignee || String(assignee.companyId) !== String(req.user.companyId)) {
			return res.status(403).json({ error: 'Assignee must belong to your company' });
		}
	}
	const item = await Task.create({ companyId: req.user.companyId, creatorId: req.user.uid, assigneeId, projectName, description, startDate, deadline, priority, remarks, status: 'OPEN', updates: [], watchers: [] });
	res.status(201).json(item);
}

export async function myAssignedTasks(req, res) {
	const items = await Task.find({ assigneeId: req.user.uid }).sort({ createdAt: -1 });
	res.json({ items });
}

export async function myCreatedTasks(req, res) {
	const items = await Task.find({ creatorId: req.user.uid }).sort({ createdAt: -1 });
	res.json({ items });
}

export async function updateTask(req, res) {
	const { id } = req.params;
	const item = await Task.findByIdAndUpdate(id, req.body, { new: true });
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function getTask(req, res) {
	const { id } = req.params;
	const item = await Task.findById(id)
		.populate('assigneeId', 'fullName email')
		.populate('creatorId', 'fullName email')
		.populate('updates.by', 'fullName email');
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function addTaskUpdate(req, res) {
	const { id } = req.params;
	const { text, action, note, status, progress } = req.body || {};
	if (!text && !action && !note && status === undefined && progress === undefined) {
		return res.status(400).json({ error: 'Provide at least one of text, action, note, status, progress' });
	}
	const item = await Task.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	const update = { by: req.user.uid, at: new Date() };
	if (text) update.text = text;
	if (action) update.action = action;
	if (note) update.note = note;
	if (status) update.status = status;
	if (typeof progress === 'number') update.progress = progress;
	item.updates.push(update);
	// Roll up status/progress if provided
	if (status) item.status = status;
	if (typeof progress === 'number') item.progress = Math.max(0, Math.min(100, progress));
	await item.save();
	const populated = await Task.findById(id)
		.populate('assigneeId', 'fullName email')
		.populate('creatorId', 'fullName email')
		.populate('updates.by', 'fullName email');
	res.json(populated);
}

export async function filterTasks(req, res) {
	const { status, assigneeId, creatorId, projectName } = req.query || {};
	const where = { companyId: req.user.companyId };
	if (status) where.status = status;
	if (assigneeId) where.assigneeId = assigneeId;
	if (creatorId) where.creatorId = creatorId;
	if (projectName) where.projectName = new RegExp(projectName, 'i');
	const items = await Task.find(where)
		.sort({ createdAt: -1 })
		.populate('assigneeId', 'fullName email')
		.populate('creatorId', 'fullName email');
	res.json({ items });
}