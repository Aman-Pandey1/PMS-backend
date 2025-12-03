import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectToDatabase } from './config/db.js';
import { env } from './config/env.js';
import fs from 'fs';
import path from 'path';
import { Attendance } from './models/Attendance.js';
import { Salary } from './models/Salary.js';
import apiRouter from './routes/index.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ 
	origin: true, // Allow all origins
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
	crossOriginResourcePolicy: { policy: "cross-origin" },
	crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// global request logging for debugging
app.use((req, _res, next) => {
	console.log(`[REQ] ${req.method} ${req.path}`, { query: req.query, body: req.body });
	next();
});

// static uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

app.use('/api', apiRouter);

async function ensureIndexes() {
	try {
		// Fix Attendance indexes
		const attendanceIndexes = await Attendance.collection.indexes();
		const legacyAttendance = attendanceIndexes.find(i => i.name === 'user_1_date_1');
		if (legacyAttendance) {
			await Attendance.collection.dropIndex('user_1_date_1');
			console.log('Dropped legacy attendance index user_1_date_1');
		}
		await Attendance.collection.createIndex({ userId: 1, date: 1 }, { name: 'userId_1_date_1', unique: true });
		console.log('Ensured attendance unique index on userId+date');

		// Fix Salary indexes - drop legacy 'user' index if it exists
		const salaryIndexes = await Salary.collection.indexes();
		const legacySalary = salaryIndexes.find(i => i.name === 'user_1');
		if (legacySalary) {
			await Salary.collection.dropIndex('user_1');
			console.log('Dropped legacy salary index user_1');
		}
		console.log('Ensured salary indexes are correct');
	} catch (e) {
		console.warn('ensureIndexes failed', e?.message || e);
	}
}

const port = env.PORT;
connectToDatabase()
	.then(async () => {
		await ensureIndexes();
		app.listen(port, () => console.log(`API listening on ${port}`));
	})
	.catch((err) => {
		console.error('Mongo connection failed', err);
		process.exit(1);
	});

export default app;