import { Router } from 'express';
import {
  applyToRequirement,
  withdrawApplication,
  getMyApplications,
  getApplicationsForRequirement,
  updateApplicationStatus,
} from '../controllers/application.controller.js';
import { applyValidator, applicationStatusValidator } from '../validators/application.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(verifyAccessToken);

// Presenter
router.post('/', authorizeRoles('presenter'), applyValidator, validate, applyToRequirement);
router.get('/mine', authorizeRoles('presenter'), getMyApplications);
router.patch('/:id/withdraw', authorizeRoles('presenter'), withdrawApplication);

// College
router.get('/requirement/:requirementId', authorizeRoles('college'), getApplicationsForRequirement);
router.patch(
  '/:id/status',
  authorizeRoles('college'),
  applicationStatusValidator,
  validate,
  updateApplicationStatus
);

export default router;
