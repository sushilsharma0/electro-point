import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    if (!env.isTest) console.info('[email] SMTP not configured; skipped send to', to, 'subject:', subject);
    return { skipped: true };
  }
  await tx.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
  return { skipped: false };
}

export async function sendPasswordReset(email, resetUrl) {
  return sendMail({
    to: email,
    subject: 'Reset your ElectroPoint password',
    text: `Reset your password: ${resetUrl}\nThis link expires in 30 minutes.`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
  });
}
