import nodemailer from 'nodemailer';
import { config } from '../lib/config';
import {
  contactFormTemplate,
  newSellerTemplate,
  newListingSubmittedTemplate,
  listingApprovedTemplate,
  listingRejectedTemplate,
  checkupRequestTemplate,
} from '../email/templates';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: config.smtp.user ? {
    user: config.smtp.user,
    pass: config.smtp.pass,
  } : undefined,
});

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!config.smtp.user) {
    console.log(`[Email - no SMTP configured] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"HT-Marineservice" <${config.smtp.from}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
}

export const emailService = {
  async sendContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    listingTitle?: string;
  }): Promise<void> {
    const { subject, html } = contactFormTemplate(data);
    await sendEmail(config.contactEmail, subject, html);
  },

  async sendNewSellerNotification(data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<void> {
    const { subject, html } = newSellerTemplate(data);
    await sendEmail(config.contactEmail, subject, html);
  },

  async sendListingSubmitted(data: {
    sellerName: string;
    listingTitle: string;
    listingId: string;
    price: number;
  }): Promise<void> {
    const { subject, html } = newListingSubmittedTemplate(data);
    await sendEmail(config.contactEmail, subject, html);
  },

  async sendListingApproved(data: {
    sellerEmail: string;
    sellerName: string;
    listingTitle: string;
    slug: string;
  }): Promise<void> {
    const { subject, html } = listingApprovedTemplate(data);
    await sendEmail(data.sellerEmail, subject, html);
  },

  async sendListingRejected(data: {
    sellerEmail: string;
    sellerName: string;
    listingTitle: string;
    reason: string;
  }): Promise<void> {
    const { subject, html } = listingRejectedTemplate(data);
    await sendEmail(data.sellerEmail, subject, html);
  },

  async sendCheckupRequest(data: {
    sellerEmail: string;
    sellerName: string;
    listingTitle: string;
    message?: string;
  }): Promise<void> {
    const { subject, html } = checkupRequestTemplate(data);
    await sendEmail(data.sellerEmail, subject, html);
  },
};
