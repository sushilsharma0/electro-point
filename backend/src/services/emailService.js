import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let transporter;

export function isMailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER);
}

function getTransporter() {
  if (!isMailConfigured()) return null;
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
    throw ApiError.unavailable('Email is not configured. Set SMTP_HOST and SMTP_USER.');
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
