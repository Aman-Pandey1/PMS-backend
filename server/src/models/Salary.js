import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const salarySchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	designation: { type: String, required: true },
	baseSalary: { type: Number, required: true },
	securityAmount: { type: Number },
	paidLeavePerMonth: { type: Number, default: 0 },
	effectiveFrom: { type: Date, required: true },
	effectiveTo: { type: Date },
}, { timestamps: true });

salarySchema.index({ userId: 1, effectiveFrom: -1 });

export const Salary = model('Salary', salarySchema);

const paymentSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	period: { year: { type: Number, required: true }, month: { type: Number, required: true } },
	amount: { type: Number, required: true },
	status: { type: String, enum: ['DUE', 'PAID'], default: 'DUE', index: true },
	paidAt: { type: Date },
	note: { type: String },
}, { timestamps: true });

paymentSchema.index({ companyId: 1, 'period.year': 1, 'period.month': 1 });

export const Payment = model('Payment', paymentSchema);