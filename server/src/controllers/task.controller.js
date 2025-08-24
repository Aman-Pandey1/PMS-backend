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
	const item = await Task.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
}

export async function addTaskUpdate(req, res) {
	const { id } = req.params;
	const { text } = req.body || {};
	if (!text) return res.status(400).json({ error: 'text required' });
	const item = await Task.findById(id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	item.updates.push({ by: req.user.uid, text, at: new Date() });
	await item.save();
	res.json(item);
}

export async function filterTasks(req, res) {
	const { status, assigneeId, creatorId, projectName } = req.query || {};
	const where = { companyId: req.user.companyId };
	if (status) where.status = status;
	if (assigneeId) where.assigneeId = assigneeId;
	if (creatorId) where.creatorId = creatorId;
	if (projectName) where.projectName = new RegExp(projectName, 'i');
	const items = await Task.find(where).sort({ createdAt: -1 });
	res.json({ items });
}