import { Router } from 'express';
import {
  createOrUpdateProfile,
  getMyProfile,
  getPresenterById,
  listPresenters,
  updateAvailability,
  uploadProfileImage,
  uploadResume,
  uploadCertificate,
  uploadVideo,
  uploadSlide,
  removeCertificate,
  removeVideo,
  removeSlide,
} from '../controllers/presenter.controller.js';
import {
  profileValidator,
  availabilityValidator,
  mediaTitleValidator,
} from '../validators/presenter.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';
import {
  uploadImage,
  uploadDocument,
  uploadVideo as uploadVideoMiddleware,
  uploadSlide as uploadSlideMiddleware,
} from '../middleware/upload.js';
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

// Public
router.get('/', optionalAuth, listPresenters);
router.get('/:id', getPresenterById);

// Presenter-only, protected
router.use(verifyAccessToken, authorizeRoles('presenter'));

router.put('/profile/me', profileValidator, validate, createOrUpdateProfile);
router.get('/profile/me', getMyProfile);
router.put('/profile/availability', availabilityValidator, validate, updateAvailability);

router.post('/profile/image', uploadImage.single('image'), uploadProfileImage);
router.post('/profile/resume', uploadDocument.single('resume'), uploadResume);

router.post(
  '/profile/certificates',
  uploadImage.single('certificate'),
  mediaTitleValidator,
  validate,
  uploadCertificate
);
router.post(
  '/profile/videos',
  uploadVideoMiddleware.single('video'),
  mediaTitleValidator,
  validate,
  uploadVideo
);
router.post(
  '/profile/slides',
  uploadSlideMiddleware.single('slide'),
  mediaTitleValidator,
  validate,
  uploadSlide
);

router.delete('/profile/certificates/:assetId', removeCertificate);
router.delete('/profile/videos/:assetId', removeVideo);
router.delete('/profile/slides/:assetId', removeSlide);

export default router;
