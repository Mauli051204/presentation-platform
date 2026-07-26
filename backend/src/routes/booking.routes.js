import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateMeetingLink,
  completeBooking,
  cancelBooking,
} from '../controllers/booking.controller.js';
import {
  createBookingValidator,
  meetingLinkValidator,
  cancelBookingValidator,
} from '../validators/booking.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(verifyAccessToken);

router.post('/', authorizeRoles('college'), createBookingValidator, validate, createBooking);
router.get('/mine', authorizeRoles('college', 'presenter'), getMyBookings);
router.get('/:id', authorizeRoles('college', 'presenter'), getBookingById);
router.patch(
  '/:id/meeting-link',
  authorizeRoles('college'),
  meetingLinkValidator,
  validate,
  updateMeetingLink
);
router.patch('/:id/complete', authorizeRoles('college'), completeBooking);
router.patch(
  '/:id/cancel',
  authorizeRoles('college'),
  cancelBookingValidator,
  validate,
  cancelBooking
);

export default router;
