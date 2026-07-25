const info = (msg, meta = '') => {
  console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta ? meta : '');
};

const warn = (msg, meta = '') => {
  console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta ? meta : '');
};

const error = (msg, meta = '') => {
  console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, meta ? meta : '');
};

module.exports = {
  info,
  warn,
  error,
};
