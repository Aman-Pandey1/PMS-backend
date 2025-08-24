import { Router } from 'express';
import { listUsers, createUser, mySubordinates } from '../controllers/user.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/', requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN'), listUsers);
r.get('/my-subordinates', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), mySubordinates);
r.post('/', requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN'), createUser);

export default r;