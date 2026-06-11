'use strict';
const express = require('express');
const nodemailer = require('nodemailer');
const { initStorage } = require('../../shared/db');

const app = express();
app.use(express.json());

const PORT = process.env.EMAIL_PORT || 4005;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || 'noreply@fems.com';
const SMTP_PASS = process.env.SMTP_PASS || 'password';

// Email transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

app.get('/health', (req, res) => {
  res.json({ service: 'email-service', status: 'ok' });
});

// Email templates
const templates = {
  inspectionScheduled: (data) => ({
    subject: `Inspection Scheduled: ${data.extinguisherLocation}`,
    html: `
      <h2>Inspection Scheduled</h2>
      <p>Hi ${data.inspectorName},</p>
      <p>An inspection has been scheduled for the extinguisher at <strong>${data.extinguisherLocation}</strong>.</p>
      <ul>
        <li><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</li>
        <li><strong>Serial Number:</strong> ${data.serialNumber}</li>
        <li><strong>Type:</strong> ${data.type}</li>
      </ul>
      <p>Please log in to FEMS to view full details and record results.</p>
      <p>Best regards,<br/>FEMS System</p>
    `,
  }),

  inspectionReminder: (data) => ({
    subject: `Reminder: Inspection Due - ${data.extinguisherLocation}`,
    html: `
      <h2>Inspection Reminder</h2>
      <p>Hi ${data.inspectorName},</p>
      <p>This is a reminder that you have an inspection scheduled for <strong>tomorrow at ${new Date(data.scheduledAt).toLocaleTimeString()}</strong>.</p>
      <p><strong>Location:</strong> ${data.extinguisherLocation}</p>
      <p>Please make sure to complete the inspection and log the results in FEMS.</p>
      <p>Best regards,<br/>FEMS System</p>
    `,
  }),

  maintenanceAlert: (data) => ({
    subject: `Maintenance Alert: ${data.extinguisherLocation}`,
    html: `
      <h2>Maintenance Required</h2>
      <p>Hi ${data.recipientName},</p>
      <p>An extinguisher at <strong>${data.extinguisherLocation}</strong> requires maintenance.</p>
      <ul>
        <li><strong>Serial Number:</strong> ${data.serialNumber}</li>
        <li><strong>Status:</strong> ${data.status}</li>
        <li><strong>Last Maintenance:</strong> ${new Date(data.lastMaintenance).toLocaleDateString()}</li>
      </ul>
      <p>Please schedule maintenance at your earliest convenience.</p>
      <p>Best regards,<br/>FEMS System</p>
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request - FEMS',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${data.userName},</p>
      <p>We received a password reset request for your FEMS account.</p>
      <p>Please use the following token to reset your password:</p>
      <p><code>${data.resetToken}</code></p>
      <p>This token will expire in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br/>FEMS System</p>
    `,
  }),

  welcomeEmail: (data) => ({
    subject: 'Welcome to FEMS',
    html: `
      <h2>Welcome to FEMS!</h2>
      <p>Hi ${data.userName},</p>
      <p>Your account has been created successfully.</p>
      <ul>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Role:</strong> ${data.role}</li>
      </ul>
      <p>You can now log in to FEMS using your credentials.</p>
      <p>If you need any help, please contact the system administrator.</p>
      <p>Best regards,<br/>FEMS System</p>
    `,
  }),
};

// Send email endpoint
app.post('/api/emails/send', async (req, res) => {
  try {
    const { to, templateName, data } = req.body;

    if (!to || !templateName || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const template = templates[templateName];
    if (!template) {
      return res.status(400).json({ error: 'Unknown template' });
    }

    const emailContent = template(data);

    const info = await transporter.sendMail({
      from: `FEMS <${SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    res.json({
      message: 'Email sent',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Queue email endpoint
app.post('/api/emails/queue', async (req, res) => {
  const { emails } = req.body;
  const results = [];

  for (const emailData of emails) {
    try {
      const template = templates[emailData.templateName];
      const emailContent = template(emailData.data);

      const info = await transporter.sendMail({
        from: `FEMS <${SMTP_USER}>`,
        to: emailData.to,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      results.push({
        email: emailData.to,
        status: 'sent',
        messageId: info.messageId,
      });
    } catch (error) {
      results.push({
        email: emailData.to,
        status: 'failed',
        error: error.message,
      });
    }
  }

  res.json({
    message: 'Batch processing complete',
    results,
  });
});

// Test email
app.post('/api/emails/test', async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: `FEMS <${SMTP_USER}>`,
      to: req.body.email || SMTP_USER,
      subject: 'Test Email from FEMS',
      html: '<h2>Test Email</h2><p>This is a test email from FEMS.</p>',
    });

    res.json({
      message: 'Test email sent',
      messageId: info.messageId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function bootstrap() {
  console.log('[email-service] Email service starting...');
  return app;
}

if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => console.log(`[email-service] listening on http://localhost:${PORT}`));
  });
}

module.exports = app;
module.exports.bootstrap = bootstrap;
