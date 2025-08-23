import { Schema, model, type Document, Types } from 'mongoose';

export type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export interface IUser extends Document {
	email: string;
	passwordHash: string;
	fullName: string;
	companyId?: Types.ObjectId;
	role: Role;
	managerId?: Types.ObjectId;
	ancestors: Types.ObjectId[];
	depth: number;
	geoAllowedZones?: any[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>({
	email: { type: String, required: true, unique: true, index: true },
	passwordHash: { type: String, required: true },
	fullName: { type: String, required: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
	role: { type: String, enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EMPLOYEE'], required: true },
	managerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
	ancestors: { type: [Schema.Types.ObjectId], index: true, default: [] },
	depth: { type: Number, default: 0 },
	geoAllowedZones: { type: Array, default: [] },
	isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ geoAllowedZones: '2dsphere' } as any);

export const User = model<IUser>('User', userSchema);