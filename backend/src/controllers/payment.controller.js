import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import { env } from '../config/env.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { assertBookingParticipant } from '../services/payment.service.js';
import { createNotification } from '../services/notification.service.js';

const wrapRazorpayError = (error, fallbackMessage) => {
  if (error?.error?.description) {
    return new ApiError(
      error.statusCode && error.statusCode < 500 ? error.statusCode : 502,
      `Payment gateway error: ${error.error.description}`
    );
  }
  return new ApiError(502, fallbackMessage);
};

export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, 'Booking not found'));

    if (booking.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this booking'));
    }
    if (booking.status !== 'pending_payment') {
      return next(
        new ApiError(400, `Booking is not awaiting payment (status: "${booking.status}")`)
      );
    }

    const existing = await Payment.findOne({
      booking: booking._id,
      status: { $in: ['created', 'paid'] },
    });
    if (existing) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { payment: existing, razorpayKeyId: env.razorpay.keyId },
            'Existing order returned'
          )
        );
    }

    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(booking.totalChargeAmount * 100),
        currency: 'INR',
        receipt: `booking_${booking._id}`,
        notes: { bookingId: booking._id.toString() },
      });
    } catch (razorpayError) {
      console.error('[razorpay] Order creation failed:', JSON.stringify(razorpayError, null, 2));
      return next(
        wrapRazorpayError(
          razorpayError,
          'Failed to create payment order. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend .env are valid test-mode keys.'
        )
      );
    }

    const payment = await Payment.create({
      booking: booking._id,
      razorpayOrderId: order.id,
      amount: booking.totalChargeAmount,
      commissionAmount: booking.commissionAmount,
      payoutAmount: booking.presenterPayoutAmount,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          payment,
          razorpayOrder: order,
          razorpayKeyId: env.razorpay.keyId,
        },
        'Razorpay order created'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return next(new ApiError(404, 'Payment record not found for this order'));

    const expectedSignature = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      payment.status = 'failed';
      await payment.save();
      return next(new ApiError(400, 'Payment signature verification failed'));
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    const booking = await Booking.findById(payment.booking).populate('requirement', 'title');
    if (booking && booking.status === 'pending_payment') {
      booking.status = 'confirmed';
      await booking.save();
    }

    if (booking) {
      const presenterProfile = await PresenterProfile.findById(booking.presenter).populate(
        'user',
        'email name'
      );
      const collegeProfile = await CollegeProfile.findById(booking.college).select(
        'collegeName logo'
      );
      if (presenterProfile?.user) {
        await createNotification(req.app.get('io'), {
          userId: presenterProfile.user._id,
          type: 'payment_received',
          title: 'Payment received',
          message: "The college has completed payment for your booking. It's now confirmed.",
          meta: {
            bookingId: booking._id,
            requirementTitle: booking.requirement?.title,
            counterpartyName: collegeProfile?.collegeName,
            counterpartyAvatarUrl: collegeProfile?.logo?.url || null,
          },
          email: { to: presenterProfile.user.email },
        });
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { payment, booking }, 'Payment verified successfully'));
  } catch (error) {
    next(error);
  }
};

export const getPaymentByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, 'Booking not found'));

    const allowed = await assertBookingParticipant(booking, req.user);
    if (!allowed) return next(new ApiError(403, 'You are not part of this booking'));

    const payment = await Payment.findOne({ booking: bookingId });
    if (!payment) return next(new ApiError(404, 'No payment found for this booking'));

    return res.status(200).json(new ApiResponse(200, payment, 'Payment fetched'));
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new ApiError(404, 'Payment not found'));

    const booking = await Booking.findById(payment.booking);
    if (!booking) return next(new ApiError(404, 'Associated booking not found'));

    if (booking.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this booking'));
    }
    if (payment.status !== 'paid') {
      return next(
        new ApiError(400, `Only "paid" payments can be refunded (current: "${payment.status}")`)
      );
    }

    let refund;
    try {
      refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: payment.amount * 100,
      });
    } catch (razorpayError) {
      console.error('[razorpay] Refund failed:', JSON.stringify(razorpayError, null, 2));
      return next(wrapRazorpayError(razorpayError, 'Failed to process refund via Razorpay.'));
    }

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = payment.amount;
    payment.refundedAt = new Date();
    await payment.save();

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || 'Refund issued';
    await booking.save();

    return res.status(200).json(new ApiResponse(200, payment, 'Payment refunded successfully'));
  } catch (error) {
    next(error);
  }
};
