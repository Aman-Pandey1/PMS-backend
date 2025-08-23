import 'dotenv/config';
import argon2 from 'argon2';
import { connectToDatabase } from '../config/db.js';
import { User } from '../models/User.js';

const DEFAULT_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'admin';

async function main() {
	await connectToDatabase();
	const exists = await User.findOne({ role: 'SUPER_ADMIN' });
	if (exists) {
		console.log('Super Admin already exists:', exists.email);
		process.exit(0);
	}
	const passwordHash = await argon2.hash(DEFAULT_PASSWORD);
	const user = await User.create({
		email: DEFAULT_EMAIL,
		passwordHash,
		fullName: 'Super Admin',
		role: 'SUPER_ADMIN',
	});
	console.log('Seeded Super Admin:', user.email);
	process.exit(0);
}

main().catch((err) => {
	console.error('Seed failed', err);
	process.exit(1);
});