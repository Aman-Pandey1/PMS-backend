import express from 'express';
const Router = express.Router;
import { checkIn, checkOut, myAttendance, companyAttendance } from '../controllers/attendance.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.post('/check-in', requireRoles('EMPLOYEE'), checkIn);
r.post('/check-out', requireRoles('EMPLOYEE'), checkOut);
r.get('/me', requireRoles('EMPLOYEE','SUPERVISOR'), myAttendance);
r.get('/company', companyAttendance);

export default r;