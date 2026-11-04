const express = require('express');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { r2, bucket, isConfigured } = require('../config/r2');
const router = express.Router();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE = /^[0-9a-f-]{36}\.(png|jpe?g|webp|svg)$/i;

/**
 * Company logos are public by nature (shown on every page), so they are streamed from the private R2 bucket
 * without a login. Only objects under company-logos/<companyId>/<uuid>.<image ext> can be reached this way.
 */
router.get('/company-logos/:companyId/:file', async (req, res, next) => {
  try {
    const { companyId, file } = req.params;
    if (!UUID.test(companyId) || !FILE.test(file) || !isConfigured) return res.status(404).end();

    const object = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: `company-logos/${companyId}/${file}` }));
    const isSvg = /\.svg$/i.test(file);
    res.set({
      'Content-Type': isSvg ? 'image/svg+xml' : object.ContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable', // every upload gets a new file name
      'Cross-Origin-Resource-Policy': 'cross-origin', // the web app runs on another origin
      // An SVG opened directly must not run scripts.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    });
    object.Body.on('error', next).pipe(res);
  } catch (err) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return res.status(404).end();
    next(err);
  }
});

module.exports = router;
