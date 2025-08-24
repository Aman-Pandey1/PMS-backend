import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const companySchema = new Schema({
	name: { type: String, required: true },
	code: { type: String, required: true, unique: true, index: true },
	status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
	address: {
		line1: { type: String },
		line2: { type: String },
		city: { type: String },
		state: { type: String },
		country: { type: String },
		zip: { type: String },
	},
	description: { type: String },
}, { timestamps: true });

export const Company = model('Company', companySchema);