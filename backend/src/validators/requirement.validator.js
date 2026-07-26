import { body } from 'express-validator';

export const requirementValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('presentationType').isIn(['online', 'offline']).withMessage('Must be online or offline'),
  body('budgetMin').isFloat({ min: 0 }).withMessage('budgetMin must be a positive number'),
  body('budgetMax').isFloat({ min: 0 }).withMessage('budgetMax must be a positive number'),
  body('eventDate').isISO8601().withMessage('eventDate must be a valid date'),
  body('durationMinutes')
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be a positive integer'),
  body('applicationDeadline').isISO8601().withMessage('applicationDeadline must be a valid date'),
  body('requiredSkills').optional().isArray(),
  body('requiredLanguages').optional().isArray(),
];

export const statusValidator = [
  body('status')
    .isIn(['draft', 'active', 'closed', 'cancelled'])
    .withMessage('Invalid status value'),
];
