import express from 'express';
import { listNotifications, markRead, getNotification } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = express.Router();

r.use(requireAuth);
r.get('/', listNotifications);
r.get('/:id', getNotification);
r.patch('/:id/read', markRead);

export default r;