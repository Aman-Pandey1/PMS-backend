import express from 'express';
import { listUsers, createUser, mySubordinates } from '../controllers/user.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { setUserActive, adminSetPassword, requestPasswordReset, performPasswordReset } from '../controllers/user.manage.controller.js';

const r = express.Router();

r.use(requireAuth);
r.get('/', requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR'), listUsers);
r.get('/my-subordinates', requireRoles('SUPERVISOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'), mySubordinates);
r.post('/', requireRoles('COMPANY_ADMIN'), createUser);
// management
r.post('/:id/active', requireRoles('SUPER_ADMIN','COMPANY_ADMIN'), setUserActive);
r.post('/:id/password', requireRoles('SUPER_ADMIN','COMPANY_ADMIN'), adminSetPassword);
// password reset
r.post('/password/forgot', requestPasswordReset);
r.post('/password/reset', performPasswordReset);

export default r;