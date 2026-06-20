const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;
const setupMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      console.log(`Nodemailer real SMTP transporter ready (using host ${process.env.SMTP_HOST}).`);
    } catch (smtpErr) {
      console.error("Failed to initialize real SMTP transport:", smtpErr);
    }
  }

  if (!transporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log("Nodemailer: Ethereal test transporter ready (real credentials not provided in .env).");
    } catch (err) {
      transporter = {
        sendMail: async (mailOptions) => {
          console.log("=== MOCK EMAIL SENT ===");
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log("=======================");
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
      console.log("Nodemailer setup failed. Using fallback mock mailer.");
    }
  }
};
setupMailer();

const sendLtcBatchEmail = async (name, email) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"LTC Administration" <no-reply@ltc.edu>',
    to: email,
    subject: 'Congratulations! You have been selected for LTC batch',
    text: `Dear ${name},\n\nCongratulations! You have been selected to attend the upcoming LTC batch.\n\nPlease complete your Insurance Form and Undertaking Form on your student dashboard.\n\nBest regards,\nLTC Administration`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #334155;">
      <h2 style="color: #0f172a;">Congratulations!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>You have been selected to attend the upcoming LTC batch.</p>
      <p>Please complete your <strong>Insurance Form</strong> and <strong>Undertaking Form</strong> on your student dashboard.</p>
      <br/><p>Best regards,<br/><strong>LTC Administration</strong></p>
    </div>`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`Email Preview URL: ${previewUrl}`);
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err);
  }
};

const sendSquadNotificationEmail = async (name, email, squad) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"LTC Administration" <no-reply@ltc.edu>',
    to: email,
    subject: 'Your LTC Squad Allocation Details',
    text: `Dear ${name},\n\nYou have been assigned to Squad: ${squad}.\n\nPlease check your dashboard for further details.\n\nBest regards,\nLTC Administration`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #334155;">
      <h2 style="color: #0f172a;">LTC Squad Allocation</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>You have been assigned to Squad: <strong style="color: #2563eb; font-size: 18px;">${squad}</strong>.</p>
      <p>Please check your student/faculty dashboard for further details and to verify your squad mates and panel activities.</p>
      <br/><p>Best regards,<br/><strong>LTC Administration</strong></p>
    </div>`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Squad allocation email sent to ${email}: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`Email Preview URL: ${previewUrl}`);
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err);
  }
};

module.exports = {
  setupMailer,
  sendLtcBatchEmail,
  sendSquadNotificationEmail,
};
