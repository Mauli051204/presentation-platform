import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentByBooking,
  refundPayment,
} from '../controllers/payment.controller.js';
import { createOrderValidator, verifyPaymentValidator } from '../validators/payment.validator.js';
import { validate } from '../middleware/validate.js';
import { verifyAccessToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(verifyAccessToken);

router.post(
  '/create-order',
  authorizeRoles('college'),
  createOrderValidator,
  validate,
  createOrder
);
router.post('/verify', authorizeRoles('college'), verifyPaymentValidator, validate, verifyPayment);
router.get('/booking/:bookingId', authorizeRoles('college', 'presenter'), getPaymentByBooking);
router.post('/:id/refund', authorizeRoles('college'), refundPayment);

export default router;
