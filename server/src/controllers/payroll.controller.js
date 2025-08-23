import { Salary, Payment } from '../models/Salary.js';

export async function getUserSalary(req, res) {
	const { id } = req.params;
	const items = await Salary.find({ userId: id }).sort({ effectiveFrom: -1 });
	res.json({ items });
}

export async function setUserSalary(req, res) {
	const { id } = req.params;
	const { designation, baseSalary, securityAmount, effectiveFrom } = req.body || {};
	const item = await Salary.create({ userId: id, companyId: req.user.companyId, designation, baseSalary, securityAmount, effectiveFrom });
	res.status(201).json(item);
}

export async function companyPayrollSummary(req, res) {
	const { companyId } = req.params || {};
	const payments = await Payment.find({ companyId });
	const total = payments.reduce((s, p) => s + p.amount, 0);
	res.json({ total, count: payments.length });
}