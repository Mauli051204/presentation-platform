import { body } from 'express-validator';

export const createBookingValidator = [
  body('applicationId').isMongoId().withMessage('Valid applicationId is required'),
  body('agreedFee').isFloat({ min: 1 }).withMessage('agreedFee must be a positive number'),
  body('meetingLink').optional().isString(),
];

export const meetingLinkValidator = [
  body('meetingLink').trim().notEmpty().withMessage('meetingLink is required').isString(),
];

export const cancelBookingValidator = [
  body('reason').trim().notEmpty().withMessage('Cancellation reason is required'),
];
