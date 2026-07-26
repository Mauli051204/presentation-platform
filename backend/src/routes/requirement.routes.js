import { Router } from 'express';
import {
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
  deleteRequirement,
  getMyRequirements,
  getRequirementById,
  listRequirements,
} from '../controllers/requirement.controller.js';
import { requirementValidator, statusValidator } from '../validators/requirement.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

// Public
router.get("/", optionalAuth, listRequirements);
router.get("/:id", getRequirementById);

// College-only, protected
router.use(verifyAccessToken, authorizeRoles('college'));

router.get('/mine/all', getMyRequirements);
router.post('/', requirementValidator, validate, createRequirement);
router.put('/:id', requirementValidator, validate, updateRequirement);
router.patch('/:id/status', statusValidator, validate, updateRequirementStatus);
router.delete('/:id', deleteRequirement);

export default router;
