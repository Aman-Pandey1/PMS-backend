import { Schema, model, type Document, Types } from 'mongoose';

export interface INotification extends Document {
	userId: Types.ObjectId;
	type: string;
	title: string;
	body?: string;
	data?: Record<string, unknown>;
	readAt?: Date;
}

const notificationSchema = new Schema<INotification>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	type: { type: String, required: true },
	title: { type: String, required: true },
	body: { type: String },
	data: { type: Schema.Types.Mixed },
	readAt: { type: Date },
}, { timestamps: true });

export const Notification = model<INotification>('Notification', notificationSchema);