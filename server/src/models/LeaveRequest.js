import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const leaveSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	startDate: { type: String, required: true },
	endDate: { type: String, required: true },
	leaveType: { type: String, enum: ['emergency','sick','vacation','other'], default: 'other' },
	reason: { type: String, required: true },
	status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
	approverChain: { type: [Schema.Types.ObjectId], default: [] },
	currentLevel: { type: Number, default: 0 },
	approvals: { type: [ { approverId: { type: Schema.Types.ObjectId, ref: 'User' }, status: { type: String }, note: { type: String }, at: { type: Date } } ], default: [] },
}, { timestamps: true });

export const LeaveRequest = model('LeaveRequest', leaveSchema);