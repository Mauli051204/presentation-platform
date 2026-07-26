import User from '../models/User.js';
import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';
import Requirement from '../models/Requirement.js';
import Application from '../models/Application.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { createNotification } from '../services/notification.service.js';
import { getCommissionPercent, setCommissionPercent } from '../services/settings.service.js';


export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalPresenters,
      totalColleges,
      activeRequirements,
      totalApplications,
      totalBookings,
      completedBookings,
      revenueAgg,
    ] = await Promise.all([
      PresenterProfile.countDocuments(),
      CollegeProfile.countDocuments(),
      Requirement.countDocuments({ status: 'active' }),
      Application.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: { $in: ['paid', 'refunded'] } } },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$amount' },
            totalCommission: { $sum: '$commissionAmount' },
            totalPayouts: { $sum: '$payoutAmount' },
          },
        },
      ]),
    ]);

    const revenue = revenueAgg[0] || { totalCollected: 0, totalCommission: 0, totalPayouts: 0 };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalPresenters,
          totalColleges,
          activeRequirements,
          totalApplications,
          totalBookings,
          completedBookings,
          revenue,
        },
        'Dashboard stats fetched'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        users.map((u) => u.toSafeObject()),
        'Users fetched',
        { page, limit, total, totalPages: Math.ceil(total / limit) }
      )
    );
  } catch (error) {
    next(error);
  }
};

export const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ApiError(404, 'User not found'));
    if (user.role === 'admin') return next(new ApiError(400, 'Cannot deactivate an admin account'));

    user.isActive = !user.isActive;
    await user.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user.toSafeObject(),
          `User ${user.isActive ? 'activated' : 'deactivated'}`
        )
      );
  } catch (error) {
    next(error);
  }
};

export const listCollegesForVerification = async (req, res, next) => {
  try {
    const { isVerified } = req.query;
    const filter = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const colleges = await CollegeProfile.find(filter)
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, colleges, 'Colleges fetched'));
  } catch (error) {
    next(error);
  }
};

export const verifyCollege = async (req, res, next) => {
  try {
    const college = await CollegeProfile.findById(req.params.id).populate('user', 'email name');
    if (!college) return next(new ApiError(404, 'College not found'));

    college.isVerified = true;
    await college.save();

    await createNotification(req.app.get('io'), {
      userId: college.user._id,
      type: 'general',
      title: 'College profile verified',
      message:
        'Your college profile has been verified by the platform admin. You can now post requirements.',
      meta: { collegeId: college._id },
      email: { to: college.user.email },
    });

    return res.status(200).json(new ApiResponse(200, college, 'College verified successfully'));
  } catch (error) {
    next(error);
  }
};

export const listAllRequirements = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const [requirements, total] = await Promise.all([
      Requirement.find(filter)
        .populate('college', 'collegeName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Requirement.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, requirements, 'Requirements fetched', {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const forceUpdateRequirementStatus = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return next(new ApiError(404, 'Requirement not found'));

    requirement.status = req.body.status;
    await requirement.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, requirement, `Requirement force-updated to "${requirement.status}"`)
      );
  } catch (error) {
    next(error);
  }
};

export const listAllPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({
          path: 'booking',
          select: 'requirement presenter college',
          populate: [
            { path: 'requirement', select: 'title' },
            { path: 'presenter', select: 'headline' },
            { path: 'college', select: 'collegeName' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, payments, 'Payments fetched', {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = { status: { $in: ['paid', 'refunded'] } };
    if (from || to) {
      match.paidAt = {};
      if (from) match.paidAt.$gte = new Date(from);
      if (to) match.paidAt.$lte = new Date(to);
    }

    const monthly = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          totalCollected: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalPayouts: { $sum: '$payoutAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return res.status(200).json(new ApiResponse(200, monthly, 'Revenue report generated'));
  } catch (error) {
    next(error);
  }
};

export const getReviewsModeration = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('reviewerUser', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(),
    ]);

    return res.status(200).json(
      new ApiResponse(200, reviews, 'Reviews fetched for moderation', {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new ApiError(404, 'Review not found'));

    await review.deleteOne();

    const ProfileModel =
      review.targetProfileModel === 'PresenterProfile' ? PresenterProfile : CollegeProfile;
    const stats = await Review.aggregate([
      {
        $match: {
          targetProfile: review.targetProfile,
          targetProfileModel: review.targetProfileModel,
        },
      },
      { $group: { _id: '$targetProfile', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await ProfileModel.findByIdAndUpdate(review.targetProfile, {
      ratingsAverage: stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0,
      ratingsCount: stats[0]?.count || 0,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Review removed and ratings recalculated'));
  } catch (error) {
    next(error);
  }
};

export const getCommissionSettings = async (req, res, next) => {
  try {
    const commissionPercent = await getCommissionPercent();
    return res.status(200).json(new ApiResponse(200, { commissionPercent }, "Commission settings fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateCommissionSettings = async (req, res, next) => {
  try {
    const commissionPercent = await setCommissionPercent(req.body.commissionPercent);
    return res
      .status(200)
      .json(new ApiResponse(200, { commissionPercent }, "Commission percent updated — applies to new bookings"));
  } catch (error) {
    next(error);
  }
};