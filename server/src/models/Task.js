import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const taskSchema = new Schema({
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	description: { type: String, required: true },
	deadline: { type: Date },
	priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
	status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE'], default: 'OPEN', index: true },
	updates: { type: [ { by: { type: Schema.Types.ObjectId, ref: 'User' }, text: String, at: Date } ], default: [] },
	watchers: { type: [Schema.Types.ObjectId], default: [] },
}, { timestamps: true });

export const Task = model('Task', taskSchema);