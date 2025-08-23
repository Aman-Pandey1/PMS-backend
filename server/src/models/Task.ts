import { Schema, model, type Document, Types } from 'mongoose';

export interface ITask extends Document {
	companyId: Types.ObjectId;
	creatorId: Types.ObjectId;
	assigneeId: Types.ObjectId;
	description: string;
	deadline?: Date;
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
	status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
	updates: { by: Types.ObjectId; text: string; at: Date }[];
	watchers: Types.ObjectId[];
}

const taskSchema = new Schema<ITask>({
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

export const Task = model<ITask>('Task', taskSchema);