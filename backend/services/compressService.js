const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const logger = require('../utils/logger');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const isPdf = (buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

const renameExtension = (name, extension) => {
  const base = String(name || 'file').replace(/\.[^./\\]+$/, '');
  return `${base}.${extension}`;
};

/**
 * Shrinks a photo: honours the EXIF rotation, scales it down to fit `maxDimension` (never up) and re-encodes as WebP.
 * Returns null when it cannot be read or the result is not smaller, so the caller keeps the original.
 */
const compressImage = async (buffer, { maxDimension }) => {
  const output = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
  return output.length < buffer.length ? output : null;
};

/**
 * Lossless PDF rewrite (object streams, no duplicated objects). The saving is modest, which is why the original is kept
 * unless the rewrite is smaller. Encrypted or unusual PDFs make pdf-lib throw; those are stored untouched.
 */
const compressPdf = async (buffer) => {
  const doc = await PDFDocument.load(buffer, { updateMetadata: false });
  const output = Buffer.from(await doc.save({ useObjectStreams: true, addDefaultPage: false }));
  return output.length < buffer.length && isPdf(output) ? output : null;
};

/**
 * Compresses a multer memory file. Photos (jpeg/png/webp) become WebP; PDFs are rewritten; everything else (svg, gif,
 * office files, archives) is stored as uploaded. Never throws: on any problem the original file is returned.
 *   -> { file, saved }  where `file` has the new buffer, size, mimetype and originalname.
 */
const compressFile = async (file, { maxDimension = 1800 } = {}) => {
  const untouched = { file, saved: 0 };
  if (!file?.buffer?.length) return untouched;

  try {
    if (IMAGE_TYPES.has(file.mimetype)) {
      const output = await compressImage(file.buffer, { maxDimension });
      if (!output) return untouched;
      return {
        file: { ...file, buffer: output, size: output.length, mimetype: 'image/webp', originalname: renameExtension(file.originalname, 'webp') },
        saved: file.buffer.length - output.length,
      };
    }

    if (file.mimetype === 'application/pdf' && isPdf(file.buffer)) {
      const output = await compressPdf(file.buffer);
      if (!output) return untouched;
      return { file: { ...file, buffer: output, size: output.length }, saved: file.buffer.length - output.length };
    }
  } catch (err) {
    logger.warn(`Compression skipped for ${file.originalname}: ${err.message}`);
  }
  return untouched;
};

module.exports = { compressFile };
