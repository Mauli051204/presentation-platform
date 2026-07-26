import { Router } from 'express';
import ApiResponse from '../utils/ApiResponse.js';
import authRoutes from './auth.routes.js';
import presenterRoutes from './presenter.routes.js';
import collegeRoutes from './college.routes.js';
import requirementRoutes from './requirement.routes.js';
import searchRoutes from './search.routes.js';
import applicationRoutes from './application.routes.js';
import chatRoutes from './chat.routes.js';
import bookingRoutes from './booking.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json(new ApiResponse(200, { status: 'ok' }, 'API is healthy'));
});

router.use('/auth', authRoutes);
router.use('/presenters', presenterRoutes);
router.use('/colleges', collegeRoutes);
router.use('/requirements', requirementRoutes);
router.use('/search', searchRoutes);
router.use('/applications', applicationRoutes);
router.use('/chat', chatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Backend API surface is now complete — remaining phases (10+) are
// frontend UI build-out + deployment, not new backend routes.

export default router;
