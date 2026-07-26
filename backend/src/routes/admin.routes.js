import { Router } from 'express';
import {
  getDashboardStats,
  listUsers,
  toggleUserActive,
  listCollegesForVerification,
  verifyCollege,
  listAllRequirements,
  forceUpdateRequirementStatus,
  listAllPayments,
  getRevenueReport,
  getReviewsModeration,
  deleteReview,
  getCommissionSettings,
  updateCommissionSettings,
} from '../controllers/admin.controller.js';
import { forceStatusValidator, commissionValidator } from '../validators/admin.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(verifyAccessToken, authorizeRoles('admin'));

router.get('/dashboard', getDashboardStats);

router.get('/users', listUsers);
router.patch('/users/:id/toggle-active', toggleUserActive);

router.get('/colleges', listCollegesForVerification);
router.patch('/colleges/:id/verify', verifyCollege);

router.get('/requirements', listAllRequirements);
router.patch(
  '/requirements/:id/status',
  forceStatusValidator,
  validate,
  forceUpdateRequirementStatus
);

router.get('/payments', listAllPayments);
router.get('/reports/revenue', getRevenueReport);

router.get('/reviews', getReviewsModeration);
router.delete('/reviews/:id', deleteReview);

router.get('/settings/commission', getCommissionSettings);
router.put('/settings/commission', commissionValidator, validate, updateCommissionSettings);

export default router;
