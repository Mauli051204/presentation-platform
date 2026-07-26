import { body } from 'express-validator';

export const profileValidator = [
  body('headline').optional().isString().isLength({ max: 150 }),
  body('bio').optional().isString().isLength({ max: 2000 }),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
  body('location.city').optional().isString(),
  body('location.state').optional().isString(),
  body('education').optional().isArray(),
  body('education.*.degree').optional().isString().notEmpty(),
  body('education.*.institution').optional().isString().notEmpty(),
  body('education.*.yearOfCompletion').optional().isInt({ min: 1950, max: 2100 }),
  body('experience').optional().isArray(),
  body('experience.*.title').optional().isString().notEmpty(),
  body('experience.*.organization').optional().isString().notEmpty(),
  body('experience.*.startDate').optional().isISO8601(),
];

export const availabilityValidator = [
  body('dates').isArray({ min: 1 }).withMessage('Dates must be a non-empty array'),
  body('dates.*').isISO8601().withMessage('Each date must be a valid ISO date'),
];

export const mediaTitleValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
];
