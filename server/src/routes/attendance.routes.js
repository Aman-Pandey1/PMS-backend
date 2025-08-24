import { Router } from 'express';
import { checkIn, checkOut, myAttendance, companyAttendance } from '../controllers/attendance.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.post('/check-in', checkIn);
r.post('/check-out', checkOut);
r.get('/me', myAttendance);
r.get('/company', companyAttendance);

export default r;