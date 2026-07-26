import { Router } from 'express';
import {
  createReview,
  getReviewsForPresenter,
  getReviewsForCollege,
} from '../controllers/review.controller.js';
import { reviewValidator } from '../validators/review.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/presenter/:id', getReviewsForPresenter);
router.get('/college/:id', getReviewsForCollege);
router.post(
  '/',
  verifyAccessToken,
  authorizeRoles('presenter', 'college'),
  reviewValidator,
  validate,
  createReview
);

export default router;
