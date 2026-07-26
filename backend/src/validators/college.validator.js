import { body } from 'express-validator';

export const collegeProfileValidator = [
  body('collegeName').optional().isString().notEmpty(),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('website').optional().isString(),
  body('contactPerson.name').optional().isString(),
  body('contactPerson.phone').optional().isString(),
  body('address.city').optional().isString(),
  body('address.state').optional().isString(),
];

export const departmentValidator = [
  body('departments').isArray().withMessage('Departments must be an array'),
  body('departments.*.name').notEmpty().withMessage('Department name is required'),
];
