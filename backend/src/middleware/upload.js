import path from 'node:path';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MODEL_EXT = new Set(['.glb', '.gltf']);
const MODEL_MIME = new Set([
  'model/gltf-binary',
  'model/gltf+json',
  'application/octet-stream',
  'application/gltf-buffer',
  'application/json',
]);
const EXECUTABLE_EXT = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.sh', '.bash',
  '.php', '.js', '.mjs', '.cjs', '.html', '.htm', '.svg', '.xml', '.dll',
  '.so', '.dylib', '.jar', '.py', '.rb', '.ps1', '.vbs', '.wsf',
]);

const memory = multer.memoryStorage();

function rejectExecutable(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (EXECUTABLE_EXT.has(ext)) {
    throw ApiError.badRequest('Executable and script uploads are not allowed');
  }
}

export const imageUpload = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    try {
      rejectExecutable(file);
      const ext = path.extname(file.originalname || '').toLowerCase();
      if (!IMAGE_EXT.has(ext) || !IMAGE_MIME.has(file.mimetype)) {
        return cb(ApiError.badRequest('Images must be jpeg, png, webp, or avif'));
      }
      cb(null, true);
    } catch (err) {
      cb(err);
    }
  },
});

export const modelUpload = multer({
  storage: memory,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    try {
      rejectExecutable(file);
      const ext = path.extname(file.originalname || '').toLowerCase();
      if (!MODEL_EXT.has(ext)) {
        return cb(ApiError.badRequest('3D models must be .glb or .gltf'));
      }
      if (!MODEL_MIME.has(file.mimetype) && file.mimetype !== 'application/octet-stream') {
        return cb(ApiError.badRequest('Invalid 3D model MIME type'));
      }
      cb(null, true);
    } catch (err) {
      cb(err);
    }
  },
});

export function singleImage(req, res, next) {
  imageUpload.single('file')(req, res, next);
}

export function singleModel(req, res, next) {
  modelUpload.single('file')(req, res, next);
}
