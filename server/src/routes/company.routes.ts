import { Router } from 'express';
import { listCompanies, createCompany, getCompany, updateCompany, deleteCompany } from '../controllers/company.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/', requireRoles('SUPER_ADMIN'), listCompanies);
r.post('/', requireRoles('SUPER_ADMIN'), createCompany);
r.get('/:id', requireRoles('SUPER_ADMIN'), getCompany);
r.patch('/:id', requireRoles('SUPER_ADMIN'), updateCompany);
r.delete('/:id', requireRoles('SUPER_ADMIN'), deleteCompany);

export default r;