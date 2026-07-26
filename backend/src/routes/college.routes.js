import { Router } from 'express';
import {
  createOrUpdateProfile,
  getMyProfile,
  getCollegeById,
  listColleges,
  updateDepartments,
  uploadLogo,
  uploadGalleryImage,
  removeGalleryImage,
} from '../controllers/college.controller.js';
import { collegeProfileValidator, departmentValidator } from '../validators/college.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

// Public
router.get('/', optionalAuth, listColleges);
router.get('/:id', getCollegeById);

// College-only, protected
router.use(verifyAccessToken, authorizeRoles('college'));

router.put('/profile/me', collegeProfileValidator, validate, createOrUpdateProfile);
router.get('/profile/me', getMyProfile);
router.put('/profile/departments', departmentValidator, validate, updateDepartments);
router.post('/profile/logo', uploadImage.single('logo'), uploadLogo);
router.post('/profile/gallery', uploadImage.single('image'), uploadGalleryImage);
router.delete('/profile/gallery/:assetId', removeGalleryImage);

export default router;
