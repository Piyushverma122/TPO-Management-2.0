const nodemailer = require('nodemailer');
const env = require('./env');

/**
 * Create Nodemailer SMTP Transporter
 * Falls back to console logging if SMTP is not configured.
 */
let transporter = null;
let smtpConfigured = false;

if (env.smtpHost && env.smtpUser && env.smtpPass) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: parseInt(env.smtpPort) || 587,
    secure: parseInt(env.smtpPort) === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
  smtpConfigured = true;
  console.log('✅ Nodemailer SMTP transport configured successfully.');
} else {
  console.warn('⚠️ SMTP not configured. Emails will be logged to console instead of sent.');
}

/**
 * Send an email. If SMTP is not configured, logs to console.
 * @param {object} mailOptions - { to, subject, html, text }
 * @returns {Promise<object>} - Send result or console log confirmation
 */
const sendMail = async (mailOptions) => {
  const from = env.smtpFrom || env.smtpUser || 'tpo@university.edu';
  const fullOptions = { from, ...mailOptions };

  if (smtpConfigured && transporter) {
    try {
      const info = await transporter.sendMail(fullOptions);
      console.log(`📧 Email sent to ${mailOptions.to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ Email send failed to ${mailOptions.to}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log('──────────────────────────────────────────');
    console.log('📧 [DEV MODE] Email would be sent:');
    console.log(`   To: ${fullOptions.to}`);
    console.log(`   Subject: ${fullOptions.subject}`);
    console.log(`   From: ${fullOptions.from}`);
    if (fullOptions.text) console.log(`   Text: ${fullOptions.text}`);
    console.log('──────────────────────────────────────────');
    return { success: true, messageId: 'dev-console-log' };
  }
};

module.exports = { transporter, sendMail, smtpConfigured };
