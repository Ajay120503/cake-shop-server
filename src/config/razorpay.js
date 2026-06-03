import Razorpay from 'razorpay';
import logger from '../utils/logger.js';

let razorpay = null;

export const initRazorpay = () => {

  console.log("ENV KEY:", process.env.RAZORPAY_KEY_ID);
  console.log("ENV SECRET:", process.env.RAZORPAY_KEY_SECRET);

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay credentials not configured');
    return null;
  }

  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("RAZORPAY INSTANCE CREATED");

  logger.info('Razorpay initialized');

  return razorpay;
};

export const getRazorpay = () => {
  if (!razorpay) {
    return initRazorpay();
  }
  return razorpay;
};
