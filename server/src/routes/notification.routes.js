import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/', listNotifications);
r.patch('/:id/read', markRead);

export default r;