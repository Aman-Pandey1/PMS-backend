import { Schema, model, type Document, Types } from 'mongoose';

export interface ISalary extends Document {
	userId: Types.ObjectId;
	companyId: Types.ObjectId;
	designation: string;
	baseSalary: number;
	securityAmount?: number;
	effectiveFrom: Date;
	effectiveTo?: Date;
}

const salarySchema = new Schema<ISalary>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	designation: { type: String, required: true },
	baseSalary: { type: Number, required: true },
	securityAmount: { type: Number },
	effectiveFrom: { type: Date, required: true },
	effectiveTo: { type: Date },
}, { timestamps: true });

salarySchema.index({ userId: 1, effectiveFrom: -1 });

export const Salary = model<ISalary>('Salary', salarySchema);

export interface IPayment extends Document {
	userId: Types.ObjectId;
	companyId: Types.ObjectId;
	period: { year: number; month: number };
	amount: number;
	status: 'DUE' | 'PAID';
	paidAt?: Date;
	note?: string;
}

const paymentSchema = new Schema<IPayment>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	period: { year: { type: Number, required: true }, month: { type: Number, required: true } },
	amount: { type: Number, required: true },
	status: { type: String, enum: ['DUE', 'PAID'], default: 'DUE', index: true },
	paidAt: { type: Date },
	note: { type: String },
}, { timestamps: true });

paymentSchema.index({ companyId: 1, 'period.year': 1, 'period.month': 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);