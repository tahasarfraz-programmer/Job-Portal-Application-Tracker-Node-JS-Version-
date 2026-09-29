import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { ApiError } from '../utils/http.js';

const ALLOWED = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const valid = (ALLOWED[path.extname(file.originalname).toLowerCase()] || []).includes(file.mimetype);
    cb(valid ? null : new ApiError(400, 'Resume must be a PDF, DOC or DOCX file'), valid);
  },
}).single('resume');
