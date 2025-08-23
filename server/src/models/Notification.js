import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	type: { type: String, required: true },
	title: { type: String, required: true },
	body: { type: String },
	data: { type: Schema.Types.Mixed },
	readAt: { type: Date },
}, { timestamps: true });

export const Notification = model('Notification', notificationSchema);