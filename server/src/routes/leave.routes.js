import express from 'express';
const Router = express.Router;
import { requestLeave, approveLeave, rejectLeave, myLeaves, companyLeaves } from '../controllers/leave.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';



const r = Router();

r.use(requireAuth);
r.post('/', requireRoles('EMPLOYEE', 'SUPERVISOR'), requestLeave);
r.get('/me', requireRoles('EMPLOYEE','SUPERVISOR'), myLeaves);
r.get('/company', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), companyLeaves);
r.post('/:id/approve', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), approveLeave);
r.post('/:id/reject', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rejectLeave);

export default r;