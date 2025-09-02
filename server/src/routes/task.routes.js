import express from 'express';
const Router = express.Router;
import { createTask, myAssignedTasks, myCreatedTasks, updateTask, getTask, addTaskUpdate, filterTasks } from '../controllers/task.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.post('/', requireRoles('SUPERVISOR'), createTask);
r.get('/assigned-to-me', myAssignedTasks);
r.get('/created-by-me', myCreatedTasks);
r.get('/filter', filterTasks);
r.get('/:id', getTask);
r.patch('/:id', updateTask);
r.post('/:id/updates', addTaskUpdate);

export default r;