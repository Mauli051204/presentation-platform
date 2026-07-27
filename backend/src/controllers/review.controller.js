import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { assertBookingParticipant } from '../services/payment.service.js';
import { createNotification } from '../services/notification.service.js';

export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId).populate('requirement', 'title');
    if (!booking) return next(new ApiError(404, 'Booking not found'));
    if (booking.status !== 'completed') {
      return next(new ApiError(400, 'Reviews can only be left after the booking is completed'));
    }

    const allowed = await assertBookingParticipant(booking, req.user);
    if (!allowed) return next(new ApiError(403, 'You are not part of this booking'));

    const reviewerRole = req.user.role;

    const existing = await Review.findOne({ booking: bookingId, reviewerRole });
    if (existing) return next(new ApiError(409, 'You have already reviewed this booking'));

    const isCollegeReviewing = reviewerRole === 'college';
    const targetType = isCollegeReviewing ? 'presenter' : 'college';
    const targetProfileModel = isCollegeReviewing ? 'PresenterProfile' : 'CollegeProfile';
    const targetProfileId = isCollegeReviewing ? booking.presenter : booking.college;

    const review = await Review.create({
      booking: bookingId,
      reviewerRole,
      reviewerUser: req.user._id,
      targetType,
      targetProfileModel,
      targetProfile: targetProfileId,
      rating,
      comment: comment || '',
    });

    const ProfileModel =
      targetProfileModel === 'PresenterProfile' ? PresenterProfile : CollegeProfile;

    const stats = await Review.aggregate([
      { $match: { targetProfile: review.targetProfile, targetProfileModel } },
      { $group: { _id: '$targetProfile', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats[0]) {
      await ProfileModel.findByIdAndUpdate(review.targetProfile, {
        ratingsAverage: Math.round(stats[0].avg * 10) / 10,
        ratingsCount: stats[0].count,
      });
    }

    const targetProfileDoc = await ProfileModel.findById(targetProfileId).populate(
      'user',
      'email name'
    );

    // Reviewer identity/avatar — who the recipient will see this review as from
    let reviewerName = req.user.name;
    let reviewerAvatarUrl = null;
    if (isCollegeReviewing) {
      const collegeProfile = await CollegeProfile.findOne({ user: req.user._id }).select(
        'collegeName logo'
      );
      reviewerName = collegeProfile?.collegeName || req.user.name;
      reviewerAvatarUrl = collegeProfile?.logo?.url || null;
    } else {
      const presenterProfile = await PresenterProfile.findOne({ user: req.user._id }).select(
        'profileImage'
      );
      reviewerAvatarUrl = presenterProfile?.profileImage?.url || null;
    }

    if (targetProfileDoc?.user) {
      await createNotification(req.app.get('io'), {
        userId: targetProfileDoc.user._id,
        type: 'review_received',
        title: 'You received a new review',
        message: comment ? `"${comment}"` : `You received a ${rating}-star review.`,
        meta: {
          bookingId,
          reviewId: review._id,
          rating,
          requirementTitle: booking.requirement?.title,
          counterpartyName: reviewerName,
          counterpartyAvatarUrl: reviewerAvatarUrl,
        },
        email: { to: targetProfileDoc.user.email },
      });
    }

    return res.status(201).json(new ApiResponse(201, review, 'Review submitted successfully'));
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'You have already reviewed this booking'));
    }
    next(error);
  }
};

export const getReviewsForPresenter = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      targetProfile: req.params.id,
      targetProfileModel: 'PresenterProfile',
    })
      .populate('reviewerUser', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, reviews, 'Presenter reviews fetched'));
  } catch (error) {
    next(error);
  }
};

export const getReviewsForCollege = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      targetProfile: req.params.id,
      targetProfileModel: 'CollegeProfile',
    })
      .populate('reviewerUser', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, reviews, 'College reviews fetched'));
  } catch (error) {
    next(error);
  }
};
