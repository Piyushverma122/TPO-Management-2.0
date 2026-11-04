const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && !process.env[`VITE_${envVar}`]) {
    console.error(`❌ FATAL CONFIG ERROR: Missing mandatory environment variable [${envVar}]. Check your .env file.`);
    if (envVar === 'SUPABASE_SERVICE_ROLE_KEY') {
      throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY is required for Supabase Auth admin operations. Startup aborted.');
    }
  }
}

const accountEndpoint = (raw) => {
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
};

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  // Where browsers reach this API; company logo links point here (they are served from R2 by /api/v1/public/company-logos).
  publicApiUrl: (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // SMTP / Nodemailer
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT || '587',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  // Cloudflare R2 object storage (offer letters and other private files)
  r2: {
    endpoint: accountEndpoint(process.env.R2_ENDPOINT),
    bucket: process.env.R2_BUCKET || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
};
