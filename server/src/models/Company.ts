import { Schema, model, type Document } from 'mongoose';

export interface ICompany extends Document {
	name: string;
	code: string;
	status: 'ACTIVE' | 'INACTIVE';
	createdAt: Date;
	updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
	name: { type: String, required: true },
	code: { type: String, required: true, unique: true, index: true },
	status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

export const Company = model<ICompany>('Company', companySchema);