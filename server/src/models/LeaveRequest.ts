import { Schema, model, type Document, Types } from 'mongoose';

export interface ILeaveRequest extends Document {
	userId: Types.ObjectId;
	companyId: Types.ObjectId;
	startDate: string; // YYYY-MM-DD
	endDate: string;   // YYYY-MM-DD
	reason: string;
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
	approverChain: Types.ObjectId[];
	currentLevel: number;
	approvals: { approverId: Types.ObjectId; status: 'APPROVED' | 'REJECTED'; note?: string; at: Date }[];
}

const leaveSchema = new Schema<ILeaveRequest>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	startDate: { type: String, required: true },
	endDate: { type: String, required: true },
	reason: { type: String, required: true },
	status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
	approverChain: { type: [Schema.Types.ObjectId], default: [] },
	currentLevel: { type: Number, default: 0 },
	approvals: { type: [
		{ approverId: { type: Schema.Types.ObjectId, ref: 'User' }, status: { type: String }, note: { type: String }, at: { type: Date } }
	], default: [] },
}, { timestamps: true });

export const LeaveRequest = model<ILeaveRequest>('LeaveRequest', leaveSchema);