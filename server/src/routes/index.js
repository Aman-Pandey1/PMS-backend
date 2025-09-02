import express from 'express';
const Router = express.Router;
import authRouter from './auth.routes.js';
import companyRouter from './company.routes.js';
import userRouter from './user.routes.js';
import attendanceRouter from './attendance.routes.js';
import leaveRouter from './leave.routes.js';
import taskRouter from './task.routes.js';
import documentRouter from './document.routes.js';
import payrollRouter from './payroll.routes.js';
import notificationRouter from './notification.routes.js';
import dashboardRouter from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/companies', companyRouter);
router.use('/users', userRouter);
router.use('/attendance', attendanceRouter);
router.use('/leaves', leaveRouter);
router.use('/tasks', taskRouter);
router.use('/documents', documentRouter);
router.use('/payroll', payrollRouter);
router.use('/notifications', notificationRouter);

export default router;