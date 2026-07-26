import { body } from 'express-validator';

export const applyValidator = [
  body('requirementId').isMongoId().withMessage('Valid requirementId is required'),
  body('coverNote').optional().isString().isLength({ max: 1000 }),
  body('proposedFee').optional().isFloat({ min: 0 }),
];

export const applicationStatusValidator = [
  body('status')
    .isIn(['shortlisted', 'rejected'])
    .withMessage('Status must be shortlisted or rejected'),
];
