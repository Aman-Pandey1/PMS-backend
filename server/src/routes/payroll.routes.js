import { Router } from 'express';
import { companyPayrollSummary, getUserSalary, setUserSalary } from '../controllers/payroll.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/company/:companyId/summary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), companyPayrollSummary);
r.get('/user/:id/salary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), getUserSalary);
r.post('/user/:id/salary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), setUserSalary);

export default r;