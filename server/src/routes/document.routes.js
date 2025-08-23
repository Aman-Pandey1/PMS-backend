import { Router } from 'express';
import { listUserDocuments, uploadUserDocument } from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/user/:id', listUserDocuments);
r.post('/user/:id', uploadUserDocument);

export default r;