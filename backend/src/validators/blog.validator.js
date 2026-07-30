import { body } from 'express-validator';

export const blogPostValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('excerpt').optional().isString().isLength({ max: 300 }),
  body('category').optional().isIn(['guide', 'tips', 'news', 'faq', 'announcement']),
  body('tags').optional().isArray(),
];

export const blogStatusValidator = [
  body('status').isIn(['draft', 'published']).withMessage('Status must be draft or published'),
];
