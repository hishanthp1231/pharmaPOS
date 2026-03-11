const nodemailer = require('nodemailer');

function getEnv(key, fallback = '') {
  return process.env[key] || fallback;
}

function isMailerConfigured() {
  return Boolean(getEnv('SMTP_HOST') && getEnv('SMTP_USER') && getEnv('SMTP_PASS'));
}

function buildTransporter() {
  const port = Number(getEnv('SMTP_PORT', '587'));
  const secure = String(getEnv('SMTP_SECURE', 'false')).toLowerCase() === 'true';
  return nodemailer.createTransport({
    host: getEnv('SMTP_HOST'),
    port,
    secure,
    auth: {
      user: getEnv('SMTP_USER'),
      pass: getEnv('SMTP_PASS')
    }
  });
}

async function sendUserCredentialsEmail({ to, username, password, role, branchName, loginUrl }) {
  if (!isMailerConfigured()) {
    console.log('[MAILER] SMTP not configured. Skipping credentials email.');
    return false;
  }
  if (!to) {
    console.log('[MAILER] Missing recipient email. Skipping credentials email.');
    return false;
  }

  const transporter = buildTransporter();
  const from = getEnv('SMTP_FROM', getEnv('SMTP_USER'));
  const subject = getEnv('CREDENTIALS_EMAIL_SUBJECT', 'Your Pharmacy POS Login Credentials');
  const safeBranch = branchName || 'your branch';
  const safeRole = role ? role.replace(/_/g, ' ') : 'user';
  const safeLoginUrl = loginUrl || getEnv('FRONTEND_URL', 'http://localhost:5173');

  const text = [
    `Hello,`,
    ``,
    `Your Pharmacy POS account has been created.`,
    `Branch: ${safeBranch}`,
    `Role: ${safeRole}`,
    `Username: ${username}`,
    `Password: ${password}`,
    ``,
    `Login here: ${safeLoginUrl}`,
    ``,
    `Please change your password after your first login.`
  ].join('\n');

  const html = `
    <p>Hello,</p>
    <p>Your Pharmacy POS account has been created.</p>
    <ul>
      <li><strong>Branch:</strong> ${safeBranch}</li>
      <li><strong>Role:</strong> ${safeRole}</li>
      <li><strong>Username:</strong> ${username}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p>Login here: <a href="${safeLoginUrl}">${safeLoginUrl}</a></p>
    <p>Please change your password after your first login.</p>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
  return true;
}

module.exports = {
  sendUserCredentialsEmail
};
