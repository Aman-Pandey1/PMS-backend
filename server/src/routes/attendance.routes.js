import express from 'express';
import { checkIn, checkOut, myAttendance, companyAttendance } from '../controllers/attendance.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = express.Router();

r.use(requireAuth);
r.post('/check-in', requireRoles('EMPLOYEE','SUPERVISOR'), checkIn);
r.post('/check-out', requireRoles('EMPLOYEE','SUPERVISOR'), checkOut);
r.get('/me', requireRoles('EMPLOYEE','SUPERVISOR'), myAttendance);
r.get('/company', companyAttendance);

export default r;