import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectToDatabase(): Promise<void> {
	mongoose.set('strictQuery', true);
	await mongoose.connect(env.MONGO_URI);
	mongoose.connection.on('error', (err) => {
		console.error('Mongo error', err);
	});
}