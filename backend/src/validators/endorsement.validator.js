import { body } from 'express-validator';

export const endorsementValidator = [
  body('skill').trim().notEmpty().withMessage('Skill is required'),
];
