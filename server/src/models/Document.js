import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const documentSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	type: { type: String, enum: ['AADHAAR', 'PAN', 'PHOTO', 'BANK'], required: true },
	storage: { provider: { type: String, required: true }, key: { type: String, required: true }, url: String, etag: String },
	metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

documentSchema.index({ userId: 1, type: 1 });

export const UserDocument = model('UserDocument', documentSchema);