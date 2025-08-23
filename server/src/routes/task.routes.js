import { Router } from 'express';
import { createTask, myAssignedTasks, myCreatedTasks, updateTask, getTask, addTaskUpdate } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.post('/', createTask);
r.get('/assigned-to-me', myAssignedTasks);
r.get('/created-by-me', myCreatedTasks);
r.get('/:id', getTask);
r.patch('/:id', updateTask);
r.post('/:id/updates', addTaskUpdate);

export default r;