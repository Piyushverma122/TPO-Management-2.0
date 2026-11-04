const { compressFile } = require('../services/compressService');
const logger = require('../utils/logger');

/**
 * Runs right after multer. Replaces req.file's buffer, size, mimetype and name with the compressed version, so every
 * service (and the file_size / mime_type it stores) sees exactly the bytes that will be written to R2.
 *   router.post('/x', upload.single('file'), compressUpload(), controller)
 *   compressUpload({ maxDimension: 512 })   // e.g. company logos
 */
const compressUpload = (options = {}) => async (req, _res, next) => {
  if (!req.file) return next();
  const before = req.file.size ?? req.file.buffer?.length ?? 0;
  const { file, saved } = await compressFile(req.file, options);
  req.file = file;
  if (saved > 0) logger.info(`Compressed ${file.originalname}: ${before} -> ${file.size} bytes (-${Math.round((saved / before) * 100)}%)`);
  return next();
};

module.exports = { compressUpload };
