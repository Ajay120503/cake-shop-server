import nodemailer from 'nodemailer';
import logger from './logger.js';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

  console.log("EMAIL_USER =", process.env.EMAIL_USER);
  console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "SET" : "NOT SET");

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text, attachments }
 */
export const sendEmail = async (options) => {
  try {
    // If email credentials are not configured, just log the email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn(`[Email Stub] To: ${options.to} | Subject: ${options.subject}`);
      logger.debug(`[Email Stub] Content: ${options.text || options.html?.substring(0, 100)}`);
      return { messageId: 'stub-' + Date.now(), accepted: [options.to] };
    }

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Cake Shop'} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
    return info;
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    // Don't throw - emails should not break the main flow
    return null;
  }
  
};

export default sendEmail;
