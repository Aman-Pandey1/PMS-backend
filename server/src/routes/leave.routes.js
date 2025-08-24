import { Router } from 'express';
import { requestLeave, approveLeave, rejectLeave, myLeaves } from '../controllers/leave.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { companyLeaves } from '../controllers/leave.controller.js';


const r = Router();

r.use(requireAuth);
r.post('/', requestLeave);
r.get('/me', myLeaves);
r.get('/company', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), companyLeaves);
r.post('/:id/approve', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), approveLeave);
r.post('/:id/reject', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rejectLeave);

export default r;