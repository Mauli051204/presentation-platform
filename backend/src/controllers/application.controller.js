import Application from '../models/Application.js';
import Requirement from '../models/Requirement.js';
import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { createNotification } from '../services/notification.service.js';

export const applyToRequirement = async (req, res, next) => {
  try {
    const { requirementId, coverNote, proposedFee } = req.body;

    const presenterProfile = await PresenterProfile.findOne({ user: req.user._id });
    if (!presenterProfile) {
      return next(new ApiError(400, 'Complete your presenter profile before applying'));
    }
    if (!presenterProfile.isProfileComplete) {
      return next(new ApiError(400, 'Your profile must be complete before applying'));
    }

    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      return next(new ApiError(404, 'Requirement not found'));
    }
    if (requirement.status !== 'active') {
      return next(new ApiError(400, 'This requirement is not currently accepting applications'));
    }
    if (new Date(requirement.applicationDeadline) < new Date()) {
      return next(new ApiError(400, 'The application deadline for this requirement has passed'));
    }

    const existing = await Application.findOne({
      requirement: requirementId,
      presenter: presenterProfile._id,
    });
    if (existing && existing.status !== 'withdrawn') {
      return next(new ApiError(409, 'You have already applied to this requirement'));
    }

    let application;
    if (existing && existing.status === 'withdrawn') {
      existing.status = 'applied';
      existing.coverNote = coverNote || '';
      existing.proposedFee = proposedFee ?? null;
      existing.reviewedAt = null;
      existing.rejectionReason = '';
      existing.withdrawReason = '';
      application = await existing.save();
    } else {
      application = await Application.create({
        requirement: requirementId,
        presenter: presenterProfile._id,
        college: requirement.college,
        coverNote: coverNote || '',
        proposedFee: proposedFee ?? null,
      });
      requirement.applicationsCount += 1;
      await requirement.save();
    }

    return res
      .status(201)
      .json(new ApiResponse(201, application, 'Application submitted successfully'));
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'You have already applied to this requirement'));
    }
    next(error);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const presenterProfile = await PresenterProfile.findOne({ user: req.user._id });
    if (!presenterProfile) return next(new ApiError(404, 'Presenter profile not found'));

    const application = await Application.findById(req.params.id)
      .populate('requirement', 'title')
      .populate({
        path: 'college',
        select: 'user collegeName',
        populate: { path: 'user', select: 'email name' },
      });
    if (!application) return next(new ApiError(404, 'Application not found'));

    if (application.presenter.toString() !== presenterProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this application'));
    }
    if (!['applied', 'shortlisted'].includes(application.status)) {
      return next(
        new ApiError(400, `Cannot withdraw an application with status "${application.status}"`)
      );
    }

    application.status = 'withdrawn';
    application.withdrawReason = reason || '';
    await application.save();

    const requirement = await Requirement.findById(
      application.requirement._id || application.requirement
    );
    if (requirement && requirement.applicationsCount > 0) {
      requirement.applicationsCount -= 1;
      await requirement.save();
    }

    if (application.college?.user) {
      await createNotification(req.app.get('io'), {
        userId: application.college.user._id,
        type: 'general',
        title: 'Presenter withdrew their application',
        message: reason
          ? `The presenter withdrew from "${application.requirement?.title}". Reason: ${reason}`
          : `The presenter withdrew their application for "${application.requirement?.title}".`,
        meta: {
          applicationId: application._id,
          requirementTitle: application.requirement?.title,
          counterpartyName: req.user.name,
        },
        email: { to: application.college.user.email },
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, application, 'Application withdrawn successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const presenterProfile = await PresenterProfile.findOne({ user: req.user._id });
    if (!presenterProfile) return next(new ApiError(404, 'Presenter profile not found'));

    const { status } = req.query;
    const filter = { presenter: presenterProfile._id };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('requirement', 'title status eventDate budgetMin budgetMax presentationType')
      .populate('college', 'collegeName logo')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, applications, 'Your applications fetched'));
  } catch (error) {
    next(error);
  }
};

export const getApplicationsForRequirement = async (req, res, next) => {
  try {
    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const requirement = await Requirement.findById(req.params.requirementId);
    if (!requirement) return next(new ApiError(404, 'Requirement not found'));

    if (requirement.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this requirement'));
    }

    const { status } = req.query;
    const filter = { requirement: requirement._id };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate({
        path: 'presenter',
        select: "headline bio skills languages ratingsAverage ratingsCount location resume profileImage education",
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, applications, 'Applications fetched'));
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const collegeProfile = await CollegeProfile.findOne({ user: req.user._id });
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const application = await Application.findById(req.params.id)
      .populate('requirement', 'title')
      .populate({
        path: 'presenter',
        select: 'user',
        populate: { path: 'user', select: 'email name' },
      });
    if (!application) return next(new ApiError(404, 'Application not found'));

    if (application.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this application'));
    }
    if (application.status !== 'applied') {
      return next(
        new ApiError(
          400,
          `Cannot change status of an application already marked "${application.status}"`
        )
      );
    }

    application.status = status;
    application.reviewedAt = new Date();
    if (status === 'rejected') {
      application.rejectionReason = reason || '';
    }
    await application.save();

    const isShortlisted = application.status === 'shortlisted';
    await createNotification(req.app.get('io'), {
      userId: application.presenter.user._id,
      type: isShortlisted ? 'application_shortlisted' : 'application_rejected',
      title: isShortlisted ? "You've been shortlisted!" : 'Application update',
      message: isShortlisted
        ? 'A college has shortlisted your application. Check your dashboard for next steps.'
        : reason
          ? `A college declined your application. Reason: ${reason}`
          : 'A college has reviewed and declined your application this time.',
      meta: {
        applicationId: application._id,
        requirementId: application.requirement?._id,
        requirementTitle: application.requirement?.title,
        counterpartyName: collegeProfile.collegeName,
        counterpartyAvatarUrl: collegeProfile.logo?.url || null,
      },
      email: { to: application.presenter.user.email },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, application, `Application marked as ${application.status}`));
  } catch (error) {
    next(error);
  }
};
