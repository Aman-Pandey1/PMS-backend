import express from 'express';
import { companyPayrollSummary, getUserSalary, setUserSalary, computeMonthlySalary, myLeaveBalance, computeMyMonthlySalary } from '../controllers/payroll.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = express.Router();

r.use(requireAuth);
r.get('/company/:companyId/summary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), companyPayrollSummary);
r.get('/user/:id/salary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), getUserSalary);
r.post('/user/:id/salary', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), setUserSalary);
r.get('/user/:userId/monthly', requireRoles('COMPANY_ADMIN', 'SUPER_ADMIN'), computeMonthlySalary);
r.get('/me/monthly', requireRoles('EMPLOYEE','SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'), computeMyMonthlySalary);
r.get('/me/leave-balance', requireRoles('EMPLOYEE','SUPERVISOR','COMPANY_ADMIN','SUPER_ADMIN'), myLeaveBalance);

export default r;