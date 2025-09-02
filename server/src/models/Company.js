import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const companySchema = new Schema({
	name: { type: String, required: true },
	code: { type: String, required: true, unique: true, index: true },
	status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
	address: {
		line1: { type: String },
		line2: { type: String },
		city: { type: String },
		state: { type: String },
		country: { type: String },
		zip: { type: String },
	},
	// Allowed geofence zones for attendance: array of GeoJSON polygons or a center+radius
	allowedGeoZones: { type: Array, default: [] },
	allowedGeoCenter: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: undefined } },
	allowedGeoRadiusMeters: { type: Number, default: undefined },
	description: { type: String },
	logo: { type: String },
	geofenceCenter: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: undefined } },
	geofenceRadiusMeters: { type: Number, default: 0 },
}, { timestamps: true });

export const Company = model('Company', companySchema);