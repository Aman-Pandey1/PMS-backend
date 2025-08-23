import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const companySchema = new Schema({
	name: { type: String, required: true },
	code: { type: String, required: true, unique: true, index: true },
	status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

export const Company = model('Company', companySchema);