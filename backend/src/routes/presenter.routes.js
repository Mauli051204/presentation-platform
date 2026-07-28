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
  getEndorsementsForPresenter,
  toggleEndorsement,
} from '../controllers/endorsement.controller.js';
import {
  profileValidator,
  availabilityValidator,
  mediaTitleValidator,
} from '../validators/presenter.validator.js';
import { endorsementValidator } from '../validators/endorsement.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import {
  uploadImage,
  uploadDocument,
  uploadVideo as uploadVideoMiddleware,
  uploadSlide as uploadSlideMiddleware,
} from '../middleware/upload.js';

const router = Router();

// Public
router.get('/', optionalAuth, listPresenters);
router.get('/:id', getPresenterById);
router.get('/:id/endorsements', optionalAuth, getEndorsementsForPresenter);

// Any authenticated user (presenter OR college) can endorse — deliberately
// placed before the presenter-only middleware below, since that would
// otherwise block colleges from ever endorsing anyone.
router.post(
  '/:id/endorsements',
  verifyAccessToken,
  endorsementValidator,
  validate,
  toggleEndorsement
);

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
