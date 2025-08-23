import { Router } from 'express';
import { createTask, myAssignedTasks, myCreatedTasks, updateTask } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.post('/', createTask);
r.get('/assigned-to-me', myAssignedTasks);
r.get('/created-by-me', myCreatedTasks);
r.patch('/:id', updateTask);

export default r;