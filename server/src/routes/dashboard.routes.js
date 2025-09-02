import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSummary } from '../controllers/dashboard.controller.js';

const r = express.Router();

r.use(requireAuth);
r.get('/summary', getSummary);

export default r;