import Contact from '../models/Contact.js';
import Subscriber from '../models/Subscriber.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { contactReplyTemplate } from '../utils/emailTemplates.js';

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    throw new ApiError(400, 'All required fields must be filled');
  }
  const contact = await Contact.create({ name, email, phone, subject, message, ipAddress: req.ip });
  sendEmail({
    to: email,
    subject: 'We received your message - Cake Shop',
    html: contactReplyTemplate(name, message),
  }).catch(() => {});
  sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || email,
    subject: 'New Contact Form Submission',
    html: '<p><strong>From:</strong> ' + name + ' (' + email + ')</p><p><strong>Subject:</strong> ' + subject + '</p><p>' + message + '</p>',
  }).catch(() => {});
  return ApiResponse.created(res, contact, 'Message sent. We will get back to you soon.');
});

export const getAllContacts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contact.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: contacts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!contact) throw new ApiError(404, 'Contact not found');
  return ApiResponse.success(res, contact, 'Contact updated');
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) throw new ApiError(404, 'Contact not found');
  return ApiResponse.success(res, null, 'Contact deleted');
});

export const subscribe = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  const sub = await Subscriber.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase(), name, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return ApiResponse.success(res, sub, 'Subscribed successfully');
});

export const unsubscribe = asyncHandler(async (req, res) => {
  const sub = await Subscriber.findOne({ email: req.body.email });
  if (sub) {
    sub.isActive = false;
    sub.unsubscribedAt = new Date();
    await sub.save();
  }
  return ApiResponse.success(res, null, 'Unsubscribed');
});

export const getSubscribers = asyncHandler(async (req, res) => {
  const subs = await Subscriber.find().sort({ createdAt: -1 });
  return ApiResponse.success(res, subs);
});

export default {
  submitContact, getAllContacts, updateContact, deleteContact,
  subscribe, unsubscribe, getSubscribers,
};
