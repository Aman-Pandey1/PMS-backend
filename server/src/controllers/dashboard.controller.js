import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Attendance } from '../models/Attendance.js';
import { Payment, Salary } from '../models/Salary.js';
import dayjs from 'dayjs';

export async function getSummary(req, res) {
	const role = req.user.role;
	const today = dayjs().format('YYYY-MM-DD');
	if (role === 'SUPER_ADMIN') {
		const [companies, users, tasksOpen, totalPayments] = await Promise.all([
			Company.countDocuments({}),
			User.countDocuments({}),
			Task.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'BLOCKED'] } }),
			Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
		]);
		return res.json({ scope: 'SUPER_ADMIN', companies, users, tasksOpen, totalPayable: totalPayments[0]?.total || 0 });
	}
	if (role === 'COMPANY_ADMIN') {
		const companyId = req.user.companyId;
		const [employees, tasksOpen, todayPresent, payments] = await Promise.all([
			User.countDocuments({ companyId }),
			Task.countDocuments({ companyId, status: { $in: ['OPEN', 'IN_PROGRESS', 'BLOCKED'] } }),
			Attendance.countDocuments({ companyId, date: today }),
			Payment.aggregate([{ $match: { companyId: new (await import('mongoose')).default.Types.ObjectId(companyId) } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
		]);
		return res.json({ scope: 'COMPANY_ADMIN', employees, tasksOpen, todayPresent, totalPayable: payments[0]?.total || 0 });
	}
	if (role === 'EMPLOYEE' || role === 'SUPERVISOR') {
		const userId = req.user.uid;
		const [myTasksOpen, todayAttendance] = await Promise.all([
			Task.countDocuments({ assigneeId: userId, status: { $in: ['OPEN', 'IN_PROGRESS', 'BLOCKED'] } }),
			Attendance.findOne({ userId, date: today })
		]);
		return res.json({ scope: role, myTasksOpen, todayAttendance });
	}
	return res.json({ scope: role });
}