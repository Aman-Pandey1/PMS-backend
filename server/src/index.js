import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectToDatabase } from './config/db.js';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// global request logging for debugging
app.use((req, _res, next) => {
	console.log(`[REQ] ${req.method} ${req.path}`, { query: req.query, body: req.body });
	next();
});

app.use('/api', apiRouter);

const port = env.PORT;
connectToDatabase()
	.then(() => {
		app.listen(port, () => console.log(`API listening on ${port}`));
	})
	.catch((err) => {
		console.error('Mongo connection failed', err);
		process.exit(1);
	});

export default app;