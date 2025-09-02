import express from 'express';
const Router = express.Router;
import { companyPayrollSummary, getUserSalary, setUserSalary, computeMonthlySalary } from '../controllers/payroll.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/company/:companyId/summary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), companyPayrollSummary);
r.get('/user/:id/salary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), getUserSalary);
r.post('/user/:id/salary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), setUserSalary);
r.get('/user/:userId/monthly', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), computeMonthlySalary);

export default r;