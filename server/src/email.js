const nodemailer = require('nodemailer')

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

async function sendOTPEmail(to, otp) {
  const t = getTransporter()
  if (!t) {
    console.warn('SMTP not configured — OTP', otp, 'would be sent to', to)
    return true
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || `"GrandLux" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your GrandLux verification code',
    html: `<div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #c8262c;">GrandLux Verification</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 16px 0;">${otp}</div>
      <p>This code expires in 10 minutes.</p>
      <p style="color: #6A6A6A; font-size: 13px;">If you did not request this code, you can safely ignore this email.</p>
    </div>`,
  })
  return true
}

module.exports = { sendOTPEmail }
