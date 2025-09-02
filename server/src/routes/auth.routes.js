import express from 'express';
import { login, me, updateMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = express.Router();

r.post('/login', login);
r.get('/me', requireAuth, me);
r.patch('/me', requireAuth, updateMe);

export default r;