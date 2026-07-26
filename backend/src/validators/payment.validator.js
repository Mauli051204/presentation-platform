import { body } from 'express-validator';

export const createOrderValidator = [
  body('bookingId').isMongoId().withMessage('Valid bookingId is required'),
];

export const verifyPaymentValidator = [
  body('razorpayOrderId').notEmpty().withMessage('razorpayOrderId is required'),
  body('razorpayPaymentId').notEmpty().withMessage('razorpayPaymentId is required'),
  body('razorpaySignature').notEmpty().withMessage('razorpaySignature is required'),
];
