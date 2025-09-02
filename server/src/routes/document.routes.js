import express from 'express';
const Router = express.Router;
import { listUserDocuments, uploadUserDocument, listCompanyDocuments, downloadDocument } from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth);
r.get('/user/:id', listUserDocuments);
r.post('/user/:id', uploadUserDocument);
r.get('/company', listCompanyDocuments);
r.get('/download/:id', downloadDocument);

export default r;