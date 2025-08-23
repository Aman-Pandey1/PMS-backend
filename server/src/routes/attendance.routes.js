import { Router } from 'express';
import { checkIn, checkOut, myAttendance } from '../controllers/attendance.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.post('/check-in', checkIn);
r.post('/check-out', checkOut);
r.get('/me', myAttendance);

export default r;