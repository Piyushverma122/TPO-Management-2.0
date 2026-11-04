const crypto = require('crypto');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { r2, bucket, isConfigured } = require('../config/r2');
const logger = require('../utils/logger');

/**
 * File storage on Cloudflare R2 (S3 compatible). The R2 bucket is private: files are only reachable
 * through short-lived signed URLs. A stored file is described by its object `key` inside the bucket.
 */
const SIGNED_URL_TTL_SECONDS = 5 * 60;

const unavailable = (message) => Object.assign(new Error(message), { statusCode: 503 });

const ensureConfigured = () => {
  if (!isConfigured) {
    throw unavailable('File storage is not configured. Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in backend/.env.');
  }
};

/** `folder/owner/.../<random>.ext` - the random part keeps keys unguessable and avoids overwrites. */
const buildKey = (folder, ...parts) => {
  const extension = String(parts.pop() || '').replace(/[^a-zA-Z0-9.]/g, '');
  return [folder, ...parts, `${crypto.randomUUID()}${extension ? `.${extension.replace(/^\./, '')}` : ''}`].join('/');
};

const putObject = async ({ key, body, contentType }) => {
  ensureConfigured();
  try {
    await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  } catch (err) {
    throw unavailable(`File upload failed: ${err.message}`);
  }
  return key;
};

/** Storage failures never block database cleanup, so this only logs. */
const removeObject = async (key) => {
  if (!key || !isConfigured) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    logger.warn(`R2 delete failed for ${key}: ${err.message}`);
  }
};

const getDownloadUrl = async (key, { fileName, contentType } = {}) => {
  ensureConfigured();
  const disposition = fileName ? `inline; filename="${String(fileName).replace(/["\\\r\n]/g, '_')}"` : undefined;
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: disposition, ResponseContentType: contentType }),
    { expiresIn: SIGNED_URL_TTL_SECONDS }
  );
};

const R2_TAG = 'r2';
const extensionOf = (name) => (String(name || '').split('.').pop() || '').toLowerCase();

/** Stores an uploaded multer file under `folder/<parts>/<random>.ext` and returns the object key. */
const storeFile = async (folder, parts, file) => {
  const key = buildKey(folder, ...parts, extensionOf(file.originalname));
  await putObject({ key, body: file.buffer, contentType: file.mimetype });
  return key;
};

/** Deletes a row's file from R2, or from its old Supabase bucket for rows created before the move. */
const removeStored = async (row, supabase) => {
  if (!row?.storage_path) return;
  if (row.bucket_name === R2_TAG) await removeObject(row.storage_path);
  else if (row.bucket_name) await supabase.storage.from(row.bucket_name).remove([row.storage_path]);
};

/**
 * Signed link for a stored row. R2 rows are signed here; older rows use their Supabase bucket, then any
 * plain http(s) link they carry. Throws a 404 when none works.
 */
const signedLinkFor = async (row, supabase, { urlColumn = 'file_url' } = {}) => {
  if (!row?.storage_path) throw Object.assign(new Error('No file is attached to this record.'), { statusCode: 404 });
  if (row.bucket_name === R2_TAG) {
    const url = await getDownloadUrl(row.storage_path, { fileName: row.file_name, contentType: row.mime_type || undefined });
    return { url, file_name: row.file_name, expires_in: SIGNED_URL_TTL_SECONDS };
  }
  if (row.bucket_name) {
    const { data, error } = await supabase.storage.from(row.bucket_name).createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
    if (!error && data?.signedUrl) return { url: data.signedUrl, file_name: row.file_name, expires_in: SIGNED_URL_TTL_SECONDS };
  }
  if (/^https?:\/\//i.test(row[urlColumn] || '')) return { url: row[urlColumn], file_name: row.file_name, expires_in: null };
  throw Object.assign(new Error('This file is not available. Please upload it again.'), { statusCode: 404 });
};

module.exports = { R2_TAG, storeFile, removeStored, signedLinkFor, isConfigured, ensureConfigured, buildKey, putObject, removeObject, getDownloadUrl, SIGNED_URL_TTL_SECONDS };
