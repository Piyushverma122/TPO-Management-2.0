const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

const { endpoint, bucket, accessKeyId, secretAccessKey } = env.r2;

const isConfigured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

// Cloudflare R2 is S3 compatible; the region is always "auto".
const r2 = isConfigured
  ? new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

module.exports = { r2, bucket, isConfigured };
