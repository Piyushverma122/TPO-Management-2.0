const { sendMail } = require('../config/mailer');
const env = require('../config/env');

/**
 * Send Welcome Email to newly created student with login credentials.
 * @param {string} toEmail - Student email
 * @param {string} studentName - Full name
 * @param {string} password - Temporary plain-text password (shown once)
 * @param {string} [loginUrl] - Optional login page URL
 */
const sendStudentWelcomeEmail = async (toEmail, studentName, password, loginUrl) => {
  const appUrl = loginUrl || env.clientUrl || 'http://localhost:3000';
  const loginLink = `${appUrl}/login`;

  const subject = 'Welcome to TPO Management System — Your Login Credentials';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to TPO Management System</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F17;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F17;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#101726;border:1px solid #202D42;border-radius:16px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#A3E635 0%,#65A30D 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#0B0F17;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                🎓 TPO Management System
              </h1>
              <p style="margin:8px 0 0;color:#0B0F17;font-size:14px;font-weight:600;opacity:0.8;">
                Training &amp; Placement Office Portal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#FFFFFF;font-size:20px;font-weight:700;">
                Welcome, ${studentName}! 🚀
              </h2>
              <p style="margin:0 0 24px;color:#94A3B8;font-size:14px;line-height:1.6;">
                Your student account has been created successfully by the Training &amp; Placement Office. 
                You can now access the placement portal using the credentials below.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F17;border:1px solid #202D42;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;color:#A3E635;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                      Your Login Credentials
                    </p>
                    
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#94A3B8;font-size:12px;font-weight:600;">Email Address</span><br/>
                          <span style="color:#FFFFFF;font-size:16px;font-weight:700;">${toEmail}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #202D42;">
                          <span style="color:#94A3B8;font-size:12px;font-weight:600;">Temporary Password</span><br/>
                          <code style="color:#A3E635;font-size:18px;font-weight:800;background-color:#162032;padding:4px 12px;border-radius:6px;border:1px solid #A3E635;display:inline-block;margin-top:4px;">
                            ${password}
                          </code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <a href="${loginLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#A3E635,#65A30D);color:#0B0F17;font-size:14px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.5px;">
                      Login to Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF3C7;border:1px solid #F59E0B;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400E;font-size:13px;font-weight:600;line-height:1.5;">
                      ⚠️ <strong>Security Notice:</strong> For your protection, please change your password immediately after your first login.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #202D42;text-align:center;">
              <p style="margin:0;color:#64748B;font-size:12px;line-height:1.5;">
                This is an automated email from the TPO Management System.<br/>
                Please do not reply to this email. If you need assistance, contact your TPO office.
              </p>
              <p style="margin:12px 0 0;color:#475569;font-size:11px;">
                © ${new Date().getFullYear()} Training &amp; Placement Office. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Welcome to TPO Management System, ${studentName}!

Your student account has been created successfully.

Login Email: ${toEmail}
Temporary Password: ${password}
Login URL: ${loginLink}

For security reasons, please change your password after your first login.

Regards,
Training & Placement Office
  `.trim();

  return sendMail({ to: toEmail, subject, html, text });
};

module.exports = {
  sendStudentWelcomeEmail,
};
