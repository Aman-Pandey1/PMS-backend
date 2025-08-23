import { Schema, model, type Document, Types } from 'mongoose';

export type DocType = 'AADHAAR' | 'PAN' | 'PHOTO' | 'BANK';

export interface IUserDocument extends Document {
	userId: Types.ObjectId;
	companyId: Types.ObjectId;
	type: DocType;
	storage: { provider: string; key: string; url?: string; etag?: string };
	metadata?: Record<string, unknown>;
}

const documentSchema = new Schema<IUserDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	type: { type: String, enum: ['AADHAAR', 'PAN', 'PHOTO', 'BANK'], required: true },
	storage: { provider: { type: String, required: true }, key: { type: String, required: true }, url: String, etag: String },
	metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

documentSchema.index({ userId: 1, type: 1 });

export const UserDocument = model<IUserDocument>('UserDocument', documentSchema);