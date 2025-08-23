import { Schema, model, type Document, Types } from 'mongoose';

export interface IAttendance extends Document {
	userId: Types.ObjectId;
	companyId: Types.ObjectId;
	date: string; // YYYY-MM-DD
	checkInAt: Date;
	checkInLocation: { type: 'Point'; coordinates: [number, number] };
	checkOutAt?: Date;
	checkOutLocation?: { type: 'Point'; coordinates: [number, number] };
	dailyReport: { submitted: boolean; text?: string };
	status: 'OPEN' | 'CLOSED' | 'FLAGGED';
}

const attendanceSchema = new Schema<IAttendance>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
	date: { type: String, required: true, index: true },
	checkInAt: { type: Date, required: true },
	checkInLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
	checkOutAt: { type: Date },
	checkOutLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number] } },
	dailyReport: { submitted: { type: Boolean, default: false }, text: { type: String } },
	status: { type: String, enum: ['OPEN', 'CLOSED', 'FLAGGED'], default: 'OPEN' },
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);