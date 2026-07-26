import { body } from 'express-validator';

export const forceStatusValidator = [
  body('status')
    .isIn(['draft', 'active', 'closed', 'cancelled'])
    .withMessage('Invalid status value'),
];
export const commissionValidator = [
  body('commissionPercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percent must be between 0 and 100'),
];