import express from 'express';
import multer from 'multer';
import path from 'path';
import { listUserDocuments, uploadUserDocument, listCompanyDocuments, downloadDocument } from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = express.Router();

// Configure multer for local uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const safeBase = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

r.use(requireAuth);
r.get('/user/:id', listUserDocuments);
// Accept multipart upload: field name "file"
r.post('/user/:id', upload.single('file'), uploadUserDocument);
r.get('/company', listCompanyDocuments);
r.get('/download/:id', downloadDocument);

export default r;