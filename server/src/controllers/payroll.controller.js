import { Salary, Payment } from '../models/Salary.js';

export async function getUserSalary(req, res) {
	const { id } = req.params;
	const items = await Salary.find({ userId: id }).sort({ effectiveFrom: -1 });
	res.json({ items });
}

export async function computeMyMonthlySalary(req, res) {
	const { year, month } = req.query;
	const ym = { year: Number(year), month: Number(month) };
	if (!ym.year || !ym.month) return res.status(400).json({ error: 'year and month required' });
	const start = new Date(ym.year, ym.month - 1, 1);
	const end = new Date(ym.year, ym.month, 0);
	const { LeaveRequest } = await import('../models/LeaveRequest.js');
	const { Company } = await import('../models/Company.js');
	const { User } = await import('../models/User.js');
	const userId = req.user.uid;
	const u = await User.findById(userId).lean();
	if (!u) return res.status(404).json({ error: 'User not found' });
	const targetCompanyId = u.companyId;
	const salary = await Salary.findOne({ userId, companyId: targetCompanyId, effectiveFrom: { $lte: end } }).sort({ effectiveFrom: -1 }).lean();
	if (!salary) return res.status(404).json({ error: 'No salary set' });
	const company = await Company.findById(targetCompanyId).lean();
	const weeklyOffDays = company?.weeklyOffDays?.length ? company.weeklyOffDays : [0];
	const holidayDatesSet = new Set((company?.holidayDates || []).map(h => h.date));
	const iso = (d)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
	const holidays = (company?.holidayDates || []).filter(h => {
		try {
			const hd = new Date(h.date);
			return hd >= start && hd <= end;
		} catch { return false; }
	});
	let workingDays = 0;
	for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
		const day = d.getDay();
		const dateStr = iso(d);
		if (weeklyOffDays.includes(day)) continue;
		if (holidayDatesSet.has(dateStr)) continue;
		workingDays++;
	}
	const leaves = await LeaveRequest.find({ userId, companyId: targetCompanyId, status: 'APPROVED', $or: [
		{ startDate: { $lte: iso(end) }, endDate: { $gte: iso(start) } },
	] }).lean();
	function datesBetween(a, b) {
		const arr = [];
		const s = new Date(a);
		const e = new Date(b);
		for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) arr.push(iso(d));
		return arr;
	}
	const usedPerTypeMap = new Map();
	for (const l of leaves) {
		const type = l.leaveType || 'other';
		for (const d of datesBetween(l.startDate, l.endDate)) {
			const dd = new Date(d);
			if (dd < start || dd > end) continue;
			if (weeklyOffDays.includes(dd.getDay())) continue;
			if (holidayDatesSet.has(d)) continue;
			usedPerTypeMap.set(type, (usedPerTypeMap.get(type) || 0) + 1);
		}
	}
	const allowancePerTypeMap = new Map();
	let definedTypes = false;
	if (Array.isArray(salary.paidLeaveTypes) && salary.paidLeaveTypes.length > 0) {
		definedTypes = true;
		for (const t of salary.paidLeaveTypes) {
			if (!t) continue;
			allowancePerTypeMap.set(t.type || 'other', Number(t.days || 0));
		}
	} else {
		const companyPolicy = Array.isArray(company?.paidLeavePolicy) ? company.paidLeavePolicy : [];
		if (companyPolicy.length > 0) {
			definedTypes = true;
			for (const p of companyPolicy) {
				if (!p) continue;
				allowancePerTypeMap.set(p.type || 'other', Number(p.days || 0));
			}
		}
	}
	const usedTotal = Array.from(usedPerTypeMap.values()).reduce((a,b)=>a+b,0);
	const allowedTotal = definedTypes ? Array.from(allowancePerTypeMap.values()).reduce((a,b)=>a+b,0) : Number(salary.paidLeavePerMonth || 0);
	let unpaidLeaveDays = 0;
	if (definedTypes) {
		const allTypes = new Set([...usedPerTypeMap.keys(), ...allowancePerTypeMap.keys()]);
		for (const t of allTypes) {
			const used = usedPerTypeMap.get(t) || 0;
			const allowed = allowancePerTypeMap.get(t) || 0;
			unpaidLeaveDays += Math.max(0, used - allowed);
		}
	} else {
		unpaidLeaveDays = Math.max(0, usedTotal - allowedTotal);
	}
	const dailyRate = workingDays ? (Number(salary.baseSalary) / workingDays) : 0;
	const deduction = dailyRate * unpaidLeaveDays;
	const payable = Math.max(0, Number(salary.baseSalary) - deduction);
	const usedPerType = Array.from(usedPerTypeMap.entries()).map(([type, days]) => ({ type, days }));
	const allowedPerType = definedTypes ? Array.from(allowancePerTypeMap.entries()).map(([type, days]) => ({ type, days })) : [];
	res.json({ period: ym, baseSalary: Number(salary.baseSalary), workingDays, paidLeaveAllowed: allowedTotal, leaveDays: usedTotal, unpaidLeaveDays, deduction, payable, allowedPerType, usedPerType, holidays });
}

export async function setUserSalary(req, res) {
	const { id } = req.params;
	const { designation, baseSalary, securityAmount, effectiveFrom, paidLeavePerMonth, paidLeaveTypes } = req.body || {};
	const { User } = await import('../models/User.js');
	const u = await User.findById(id).lean();
	if (!u) return res.status(404).json({ error: 'User not found' });
	if (req.user.role === 'COMPANY_ADMIN' && String(u.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
	const item = await Salary.create({ userId: id, companyId: u.companyId, designation, baseSalary, securityAmount, effectiveFrom, paidLeavePerMonth, paidLeaveTypes });
	res.status(201).json(item);
}

export async function computeMonthlySalary(req, res) {
	const { userId } = req.params;
	const { year, month } = req.query;
	const ym = { year: Number(year), month: Number(month) };
	if (!ym.year || !ym.month) return res.status(400).json({ error: 'year and month required' });
	const start = new Date(ym.year, ym.month - 1, 1);
	const end = new Date(ym.year, ym.month, 0);
	const { Attendance } = await import('../models/Attendance.js');
	const { LeaveRequest } = await import('../models/LeaveRequest.js');
	const { Company } = await import('../models/Company.js');
	const { User } = await import('../models/User.js');
	const u = await User.findById(userId).lean();
	if (!u) return res.status(404).json({ error: 'User not found' });
	if (req.user.role === 'COMPANY_ADMIN' && String(u.companyId) !== String(req.user.companyId)) return res.status(403).json({ error: 'Forbidden' });
	const targetCompanyId = u.companyId;
	const salary = await Salary.findOne({ userId, companyId: targetCompanyId, effectiveFrom: { $lte: end } }).sort({ effectiveFrom: -1 }).lean();
	if (!salary) return res.status(404).json({ error: 'No salary set' });
	const company = await Company.findById(targetCompanyId).lean();
	const weeklyOffDays = company?.weeklyOffDays?.length ? company.weeklyOffDays : [0];
	const holidayDatesSet = new Set((company?.holidayDates || []).map(h => h.date));
	const iso = (d)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
	// Holidays within the selected month
	const holidays = (company?.holidayDates || []).filter(h => {
		try {
			const hd = new Date(h.date);
			return hd >= start && hd <= end;
		} catch { return false; }
	});
	// Count working days in month excluding weekly offs and holidays
	let workingDays = 0;
	for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
		const day = d.getDay();
		const dateStr = iso(d);
		if (weeklyOffDays.includes(day)) continue; // exclude Sundays or configured weekly offs
		if (holidayDatesSet.has(dateStr)) continue;
		workingDays++;
	}
	// Approved leaves within month (use employee's company calendar)
	const leaves = await LeaveRequest.find({ userId, companyId: targetCompanyId, status: 'APPROVED', $or: [
		{ startDate: { $lte: iso(end) }, endDate: { $gte: iso(start) } },
	] }).lean();
	function datesBetween(a, b) {
		const arr = [];
		const s = new Date(a);
		const e = new Date(b);
		for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) arr.push(iso(d));
		return arr;
	}
	const usedPerTypeMap = new Map();
	for (const l of leaves) {
		const type = l.leaveType || 'other';
		for (const d of datesBetween(l.startDate, l.endDate)) {
			const dd = new Date(d);
			if (dd < start || dd > end) continue;
			if (weeklyOffDays.includes(dd.getDay())) continue;
			if (holidayDatesSet.has(d)) continue;
			usedPerTypeMap.set(type, (usedPerTypeMap.get(type) || 0) + 1);
		}
	}
	// Load company-level paid leave policy; salary-level overrides if defined
	const allowancePerTypeMap = new Map();
	let definedTypes = false;
	if (Array.isArray(salary.paidLeaveTypes) && salary.paidLeaveTypes.length > 0) {
		definedTypes = true;
		for (const t of salary.paidLeaveTypes) {
			if (!t) continue;
			allowancePerTypeMap.set(t.type || 'other', Number(t.days || 0));
		}
	} else {
		const companyPolicy = Array.isArray(company?.paidLeavePolicy) ? company.paidLeavePolicy : [];
		if (companyPolicy.length > 0) {
			definedTypes = true;
			for (const p of companyPolicy) {
				if (!p) continue;
				allowancePerTypeMap.set(p.type || 'other', Number(p.days || 0));
			}
		}
	}
	const usedTotal = Array.from(usedPerTypeMap.values()).reduce((a,b)=>a+b,0);
	const allowedTotal = definedTypes ? Array.from(allowancePerTypeMap.values()).reduce((a,b)=>a+b,0) : Number(salary.paidLeavePerMonth || 0);
	let unpaidLeaveDays = 0;
	if (definedTypes) {
		const allTypes = new Set([...usedPerTypeMap.keys(), ...allowancePerTypeMap.keys()]);
		for (const t of allTypes) {
			const used = usedPerTypeMap.get(t) || 0;
			const allowed = allowancePerTypeMap.get(t) || 0;
			unpaidLeaveDays += Math.max(0, used - allowed);
		}
	} else {
		unpaidLeaveDays = Math.max(0, usedTotal - allowedTotal);
	}
	// Daily rate based on working days only
	const dailyRate = workingDays ? (Number(salary.baseSalary) / workingDays) : 0;
	const deduction = dailyRate * unpaidLeaveDays;
	const payable = Math.max(0, Number(salary.baseSalary) - deduction);
	const usedPerType = Array.from(usedPerTypeMap.entries()).map(([type, days]) => ({ type, days }));
	const allowedPerType = definedTypes ? Array.from(allowancePerTypeMap.entries()).map(([type, days]) => ({ type, days })) : [];
	res.json({ period: ym, baseSalary: Number(salary.baseSalary), workingDays, paidLeaveAllowed: allowedTotal, leaveDays: usedTotal, unpaidLeaveDays, deduction, payable, allowedPerType, usedPerType, holidays });
}

export async function companyPayrollSummary(req, res) {
	const { companyId } = req.params || {};
	const payments = await Payment.find({ companyId });
	const total = payments.reduce((s, p) => s + p.amount, 0);
	res.json({ total, count: payments.length });
}

export async function myLeaveBalance(req, res) {
	const uid = req.user.uid;
	const now = new Date();
	const { year = now.getFullYear(), month = now.getMonth() + 1 } = req.query || {};
	const ym = { year: Number(year), month: Number(month) };
	if (!ym.year || !ym.month) return res.status(400).json({ error: 'year and month required' });
	const start = new Date(ym.year, ym.month - 1, 1);
	const end = new Date(ym.year, ym.month, 0);
	const { LeaveRequest } = await import('../models/LeaveRequest.js');
	const { Company } = await import('../models/Company.js');
	const { User } = await import('../models/User.js');
	const u = await User.findById(uid).lean();
	if (!u) return res.status(404).json({ error: 'User not found' });
	const targetCompanyId = u.companyId;
	const salary = await Salary.findOne({ userId: uid, companyId: targetCompanyId, effectiveFrom: { $lte: end } }).sort({ effectiveFrom: -1 }).lean();
	// For balance: prefer salary per-type, else company policy per-type; fallback to overall.
	let allowedPaid = Number(salary?.paidLeavePerMonth || 0);
	const perType = Array.isArray(salary?.paidLeaveTypes) && salary.paidLeaveTypes.length ? salary.paidLeaveTypes : (Array.isArray((await (await import('../models/Company.js')).Company.findById(targetCompanyId).lean())?.paidLeavePolicy) ? (await (await import('../models/Company.js')).Company.findById(targetCompanyId).lean()).paidLeavePolicy : []);
	if (perType.length) allowedPaid = perType.reduce((a,b)=>a + Number(b?.days||0), 0);
	const company = await Company.findById(targetCompanyId).lean();
	const weeklyOffDays = company?.weeklyOffDays?.length ? company.weeklyOffDays : [0];
	const holidayDatesSet = new Set((company?.holidayDates || []).map(h => h.date));
	const iso = (d)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
	function datesBetween(a, b) {
		const arr = [];
		const s = new Date(a);
		const e = new Date(b);
		for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) arr.push(iso(d));
		return arr;
	}
	const leaves = await LeaveRequest.find({ userId: uid, companyId: targetCompanyId, status: 'APPROVED', $or: [
		{ startDate: { $lte: iso(end) }, endDate: { $gte: iso(start) } },
	] }).lean();
	const leaveDates = new Set();
	for (const l of leaves) {
		for (const d of datesBetween(l.startDate, l.endDate)) {
			const dd = new Date(d);
			if (dd < start || dd > end) continue;
			if (weeklyOffDays.includes(dd.getDay())) continue;
			if (holidayDatesSet.has(d)) continue;
			leaveDates.add(d);
		}
	}
	const remainingPaidLeave = Math.max(0, allowedPaid - leaveDates.size);
	res.json({ period: ym, paidLeaveAllowed: allowedPaid, usedPaidLeave: leaveDates.size, remainingPaidLeave });
}