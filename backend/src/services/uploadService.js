import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const IMAGE_MAGICS = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  { mime: 'image/avif', test: (b) => b.toString('ascii', 4, 8) === 'ftyp' && b.toString('ascii', 8, 12).includes('avi') },
];

function isExecutableMagic(buf) {
  if (buf[0] === 0x4d && buf[1] === 0x5a) return true; // MZ
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return true; // ELF
  if (buf[0] === 0x23 && buf[1] === 0x21) return true; // shebang
  return false;
}

function uploadRoot() {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function processImage(file) {
  if (!file?.buffer) throw ApiError.badRequest('No file uploaded');
  if (isExecutableMagic(file.buffer)) throw ApiError.badRequest('File type not allowed');
  const magicOk = IMAGE_MAGICS.some((m) => m.test(file.buffer));
  if (!magicOk) throw ApiError.badRequest('Image magic bytes do not match an allowed format');

  const image = sharp(file.buffer, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  if (!['jpeg', 'png', 'webp', 'avif'].includes(meta.format)) {
    throw ApiError.badRequest('Unsupported image format');
  }
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
  const rel = path.posix.join('images', filename);
  const absDir = path.join(uploadRoot(), 'images');
  await ensureDir(absDir);
  await image
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(absDir, filename));
  return {
    url: `/uploads/${rel}`,
    width: meta.width,
    height: meta.height,
    format: 'webp',
  };
}

export async function processModel3d(file) {
  if (!file?.buffer) throw ApiError.badRequest('No file uploaded');
  if (isExecutableMagic(file.buffer)) throw ApiError.badRequest('File type not allowed');
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext === '.glb') {
    const magic = file.buffer.toString('ascii', 0, 4);
    if (magic !== 'glTF') throw ApiError.badRequest('Invalid GLB file (missing glTF magic)');
  } else if (ext === '.gltf') {
    const text = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 2048)).trim();
    if (!text.startsWith('{') || !text.includes('asset')) {
      throw ApiError.badRequest('Invalid GLTF JSON');
    }
  } else {
    throw ApiError.badRequest('Only .glb and .gltf are allowed');
  }
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const rel = path.posix.join('models', filename);
  const absDir = path.join(uploadRoot(), 'models');
  await ensureDir(absDir);
  await fs.writeFile(path.join(absDir, filename), file.buffer);
  return {
    url: `/uploads/${rel}`,
    format: ext.slice(1),
    size: file.buffer.length,
  };
}
