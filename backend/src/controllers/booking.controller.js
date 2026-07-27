import Booking from '../models/Booking.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
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

    const existingBooking = await Booking.findOne({ application: applicationId });
    if (existingBooking) {
      return next(new ApiError(409, 'A booking already exists for this application'));
    }

    if (application.status !== 'shortlisted') {
      return next(new ApiError(400, 'Only shortlisted applications can be booked'));
    }

    const requirement = application.requirement;
    if (requirement.presentationType === 'online' && !meetingLink) {
      return next(new ApiError(400, 'meetingLink is required for online presentations'));
    }

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
      meta: {
        bookingId: booking._id,
        requirementTitle: requirement.title,
        counterpartyName: collegeProfile.collegeName,
        counterpartyAvatarUrl: collegeProfile.logo?.url || null,
      },
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

const attachHasReviewed = async (bookings, reviewerRole) => {
  const bookingIds = bookings.map((b) => b._id);
  const reviews = await Review.find({ booking: { $in: bookingIds }, reviewerRole }).select(
    'booking'
  );
  const reviewedSet = new Set(reviews.map((r) => r.booking.toString()));
  return bookings.map((b) => {
    const obj = b.toObject();
    obj.hasReviewed = reviewedSet.has(b._id.toString());
    return obj;
  });
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

    const withReviewFlag = await attachHasReviewed(bookings, req.user.role);

    return res.status(200).json(new ApiResponse(200, withReviewFlag, 'Bookings fetched'));
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

    const existingReview = await Review.findOne({
      booking: booking._id,
      reviewerRole: req.user.role,
    });
    const result = booking.toObject();
    result.hasReviewed = Boolean(existingReview);

    return res.status(200).json(new ApiResponse(200, result, 'Booking fetched'));
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

    const booking = await Booking.findById(req.params.id).populate('requirement', 'title');
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

    // Cascade: the associated Application should reflect that this
    // engagement is fully done, not still sitting at "booked" — this is
    // what lets the presenter's "My Applications" page show a distinct
    // "Completed" tab instead of leaving completed bookings stuck under
    // "Booked" forever.
    await Application.findByIdAndUpdate(booking.application, { status: 'completed' });

    const payment = await Payment.findOne({ booking: booking._id, status: 'paid' });
    if (payment) {
      payment.payoutReleased = true;
      payment.payoutReleasedAt = new Date();
      await payment.save();
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
        meta: {
          bookingId: booking._id,
          requirementTitle: booking.requirement?.title,
          counterpartyName: collegeProfile.collegeName,
          counterpartyAvatarUrl: collegeProfile.logo?.url || null,
        },
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

    const booking = await Booking.findById(req.params.id).populate('requirement', 'title');
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
        meta: {
          bookingId: booking._id,
          requirementTitle: booking.requirement?.title,
          counterpartyName: collegeProfile.collegeName,
          counterpartyAvatarUrl: collegeProfile.logo?.url || null,
        },
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
