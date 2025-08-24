import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
	email: { type: String, required: true, unique: true, index: true },
	passwordHash: { type: String, required: true },
	fullName: { type: String, required: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
	role: { type: String, enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'HR', 'EMPLOYEE'], required: true },
	managerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
	ancestors: { type: [Schema.Types.ObjectId], index: true, default: [] },
	depth: { type: Number, default: 0 },
	geoAllowedZones: { type: Array, default: [] },
	isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ geoAllowedZones: '2dsphere' });

export const User = model('User', userSchema);