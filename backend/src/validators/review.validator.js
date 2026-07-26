import { body } from 'express-validator';

export const reviewValidator = [
  body('bookingId').isMongoId().withMessage('Valid bookingId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 1000 }),
];
