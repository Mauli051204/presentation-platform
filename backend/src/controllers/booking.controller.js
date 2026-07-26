import Booking from '../models/Booking.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import razorpay from '../config/razorpay.js';
import { getCommissionPercent } from '../services/settings.service.js';
import { createNotification } from '../services/notification.service.js';

export const createBooking = async (req, res, next) => {
  try {
    const { applicationId, agreedFee, meetingLink } = req.body;

    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const application = await Application.findById(applicationId)
      .populate('requirement')
      .populate({
        path: 'presenter',
        select: 'user',
        populate: { path: 'user', select: 'email name' },
      });
    if (!application) return next(new ApiError(404, 'Application not found'));

    if (application.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this application'));
    }
    if (application.status !== 'shortlisted') {
      return next(new ApiError(400, 'Only shortlisted applications can be booked'));
    }

    const existingBooking = await Booking.findOne({ application: applicationId });
    if (existingBooking) {
      return next(new ApiError(409, 'A booking already exists for this application'));
    }

    const requirement = application.requirement;
    if (requirement.presentationType === 'online' && !meetingLink) {
      return next(new ApiError(400, 'meetingLink is required for online presentations'));
    }

    // Commission is added ON TOP of the agreed fee — the college pays
    // agreedFee + commission, and the presenter receives the full agreedFee
    // with nothing deducted. commissionPercent is read live from platform
    // settings (admin-customizable) and snapshotted onto the booking so
    // historical bookings stay consistent even if the admin changes it later.
    const commissionPercent = await getCommissionPercent();
    const commissionAmount = Math.round((agreedFee * commissionPercent) / 100);
    const totalChargeAmount = agreedFee + commissionAmount;
    const presenterPayoutAmount = agreedFee;

    const booking = await Booking.create({
      application: applicationId,
      requirement: requirement._id,
      presenter: application.presenter._id,
      college: collegeProfile._id,
      presentationType: requirement.presentationType,
      meetingLink: requirement.presentationType === 'online' ? meetingLink : null,
      scheduledDate: requirement.eventDate,
      agreedFee,
      commissionPercent,
      commissionAmount,
      totalChargeAmount,
      presenterPayoutAmount,
    });

    application.status = 'booked';
    await application.save();

    await createNotification(req.app.get('io'), {
      userId: application.presenter.user._id,
      type: 'booking_created',
      title: "You've been booked!",
      message: `Your presentation "${requirement.title}" has been booked. Awaiting payment confirmation from the college.`,
      meta: { bookingId: booking._id },
      email: { to: application.presenter.user.email },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, booking, 'Booking created — proceed to payment from Bookings'));
  } catch (error) {
    next(error);
  }
};

const resolveOwnerFilter = async (req) => {
  if (req.user.role === 'college') {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return null;
    return { college: collegeProfile._id };
  }
  if (req.user.role === 'presenter') {
    const presenterProfile = await PresenterProfile.findOne({ user: req.user._id });
    if (!presenterProfile) return null;
    return { presenter: presenterProfile._id };
  }
  return null;
};

export const getMyBookings = async (req, res, next) => {
  try {
    const filter = await resolveOwnerFilter(req);
    if (!filter) return next(new ApiError(404, 'Profile not found for this role'));

    const { status } = req.query;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('requirement', 'title eventDate presentationType')
      .populate({
        path: 'presenter',
        select: 'headline bio user',
        populate: { path: 'user', select: 'name' },
      })
      .populate('college', 'collegeName logo')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, bookings, 'Bookings fetched'));
  } catch (error) {
    next(error);
  }
};

const assertParticipant = async (booking, req) => {
  if (req.user.role === 'college') {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    return collegeProfile && booking.college.toString() === collegeProfile._id.toString();
  }
  if (req.user.role === 'presenter') {
    const presenterProfile = await PresenterProfile.findOne({ user: req.user._id });
    return presenterProfile && booking.presenter.toString() === presenterProfile._id.toString();
  }
  return false;
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('requirement', 'title eventDate presentationType durationMinutes')
      .populate({
        path: 'presenter',
        select: 'headline bio user',
        populate: { path: 'user', select: 'name' },
      })
      .populate('college', 'collegeName logo');

    if (!booking) return next(new ApiError(404, 'Booking not found'));

    const allowed = await assertParticipant(booking, req);
    if (!allowed) return next(new ApiError(403, 'You are not part of this booking'));

    return res.status(200).json(new ApiResponse(200, booking, 'Booking fetched'));
  } catch (error) {
    next(error);
  }
};

export const updateMeetingLink = async (req, res, next) => {
  try {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ApiError(404, 'Booking not found'));

    if (booking.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this booking'));
    }
    if (booking.presentationType !== 'online') {
      return next(new ApiError(400, 'Meeting link only applies to online presentations'));
    }
    if (booking.status === 'cancelled') {
      return next(new ApiError(400, 'Cannot update a cancelled booking'));
    }

    booking.meetingLink = req.body.meetingLink;
    await booking.save();

    return res.status(200).json(new ApiResponse(200, booking, 'Meeting link updated'));
  } catch (error) {
    next(error);
  }
};

export const completeBooking = async (req, res, next) => {
  try {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ApiError(404, 'Booking not found'));

    if (booking.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this booking'));
    }
    if (booking.status !== 'confirmed') {
      return next(
        new ApiError(
          400,
          `Booking must be "confirmed" (paid) before it can be marked completed. Current status: "${booking.status}"`
        )
      );
    }

    booking.status = 'completed';
    booking.collegeConfirmedCompletion = true;
    booking.completedAt = new Date();
    await booking.save();

    const payment = await Payment.findOne({ booking: booking._id, status: 'paid' });
    if (payment) {
      payment.payoutReleased = true;
      payment.payoutReleasedAt = new Date();
      await payment.save();
      // NOTE: Actual bank transfer to the presenter requires RazorpayX Payouts
      // (separate product, needs a linked RazorpayX account) — Pending Dependency.
    }

    const presenterProfile = await PresenterProfile.findById(booking.presenter).populate(
      'user',
      'email name'
    );
    if (presenterProfile?.user) {
      await createNotification(req.app.get('io'), {
        userId: presenterProfile.user._id,
        type: 'booking_completed',
        title: 'Booking completed — payout released',
        message:
          "Your presentation has been marked complete and your payout has been released. Don't forget to leave a review!",
        meta: { bookingId: booking._id },
        email: { to: presenterProfile.user.email },
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, booking, 'Booking marked completed — payout released'));
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ApiError(404, 'Booking not found'));

    if (booking.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this booking'));
    }
    if (!['pending_payment', 'confirmed'].includes(booking.status)) {
      return next(new ApiError(400, `Cannot cancel a booking with status "${booking.status}"`));
    }

    const payment = await Payment.findOne({ booking: booking._id, status: 'paid' });
    if (payment) {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: payment.amount * 100,
      });
      payment.status = 'refunded';
      payment.refundId = refund.id;
      payment.refundAmount = payment.amount;
      payment.refundedAt = new Date();
      await payment.save();
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason;
    await booking.save();

    const presenterProfile = await PresenterProfile.findById(booking.presenter).populate(
      'user',
      'email name'
    );
    if (presenterProfile?.user) {
      await createNotification(req.app.get('io'), {
        userId: presenterProfile.user._id,
        type: 'general',
        title: 'Booking cancelled',
        message: `The college cancelled your booking. Reason: ${req.body.reason}`,
        meta: { bookingId: booking._id },
        email: { to: presenterProfile.user.email },
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          booking,
          payment ? 'Booking cancelled and payment refunded' : 'Booking cancelled'
        )
      );
  } catch (error) {
    next(error);
  }
};
