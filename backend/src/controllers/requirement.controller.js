import Requirement from '../models/Requirement.js';
import CollegeProfile from '../models/CollegeProfile.js';
import Application from '../models/Application.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { logSearch } from '../services/search.service.js';

const getOwnedCollegeProfile = async (userId) => {
  const profile = await CollegeProfile.findOne({ user: userId });
  return profile;
};

export const createRequirement = async (req, res, next) => {
  try {
    const collegeProfile = await getOwnedCollegeProfile(req.user._id);
    if (!collegeProfile) {
      return next(new ApiError(400, 'Complete your college profile before posting a requirement'));
    }

    const requirement = await Requirement.create({
      college: collegeProfile._id,
      ...req.body,
      status: 'draft',
    });

    return res.status(201).json(new ApiResponse(201, requirement, 'Requirement created as draft'));
  } catch (error) {
    next(error);
  }
};

export const updateRequirement = async (req, res, next) => {
  try {
    const collegeProfile = await getOwnedCollegeProfile(req.user._id);
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return next(new ApiError(404, 'Requirement not found'));

    if (requirement.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this requirement'));
    }

    const allowedFields = [
      'title',
      'description',
      'department',
      'presentationType',
      'requiredSkills',
      'requiredLanguages',
      'budgetMin',
      'budgetMax',
      'numberOfPresentersNeeded',
      'eventDate',
      'durationMinutes',
      'applicationDeadline',
      'location',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) requirement[field] = req.body[field];
    });

    await requirement.save();

    return res
      .status(200)
      .json(new ApiResponse(200, requirement, 'Requirement updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateRequirementStatus = async (req, res, next) => {
  try {
    const collegeProfile = await getOwnedCollegeProfile(req.user._id);
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return next(new ApiError(404, 'Requirement not found'));

    if (requirement.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this requirement'));
    }

    requirement.status = req.body.status;
    await requirement.save();

    return res
      .status(200)
      .json(new ApiResponse(200, requirement, `Requirement marked as ${requirement.status}`));
  } catch (error) {
    next(error);
  }
};

export const deleteRequirement = async (req, res, next) => {
  try {
    const collegeProfile = await getOwnedCollegeProfile(req.user._id);
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return next(new ApiError(404, 'Requirement not found'));

    if (requirement.college.toString() !== collegeProfile._id.toString()) {
      return next(new ApiError(403, 'You do not own this requirement'));
    }

    const applicationCount = await Application.countDocuments({
      requirement: requirement._id,
      status: { $ne: 'withdrawn' },
    });

    if (applicationCount > 0) {
      return next(
        new ApiError(
          409,
          `Cannot delete this requirement — it has ${applicationCount} active application(s). Close it instead.`
        )
      );
    }

    await requirement.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, 'Requirement deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyRequirements = async (req, res, next) => {
  try {
    const collegeProfile = await getOwnedCollegeProfile(req.user._id);
    if (!collegeProfile) return next(new ApiError(404, 'College profile not found'));

    const requirements = await Requirement.find({ college: collegeProfile._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json(new ApiResponse(200, requirements, 'Your requirements fetched'));
  } catch (error) {
    next(error);
  }
};

export const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id).populate(
      'college',
      'collegeName logo address'
    );
    if (!requirement) return next(new ApiError(404, 'Requirement not found'));

    return res.status(200).json(new ApiResponse(200, requirement, 'Requirement fetched'));
  } catch (error) {
    next(error);
  }
};

export const listRequirements = async (req, res, next) => {
  try {
    const {
      keyword,
      skills,
      languages,
      city,
      presentationType,
      department,
      budgetMin,
      budgetMax,
      dateFrom,
      dateTo,
      sortBy,
    } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };

    if (keyword) filter.$text = { $search: keyword };
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      filter.requiredSkills = { $in: skillList.map((s) => new RegExp(s, 'i')) };
    }
    if (languages) {
      const langList = languages.split(',').map((l) => l.trim());
      filter.requiredLanguages = { $in: langList.map((l) => new RegExp(l, 'i')) };
    }
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (presentationType) filter.presentationType = presentationType;
    if (department) filter.department = new RegExp(department, 'i');
    if (budgetMin || budgetMax) {
      filter.budgetMax = filter.budgetMax || {};
      if (budgetMin) filter.budgetMax.$gte = Number(budgetMin);
      if (budgetMax) filter.budgetMin = { $lte: Number(budgetMax) };
    }
    if (dateFrom || dateTo) {
      filter.eventDate = {};
      if (dateFrom) filter.eventDate.$gte = new Date(dateFrom);
      if (dateTo) filter.eventDate.$lte = new Date(dateTo);
    }

    let sort = { eventDate: 1 };
    if (sortBy === 'newest') sort = { createdAt: -1 };
    if (sortBy === 'budgetHigh') sort = { budgetMax: -1 };
    if (keyword) sort = { score: { $meta: 'textScore' } };

    const [requirements, total] = await Promise.all([
      Requirement.find(filter, keyword ? { score: { $meta: 'textScore' } } : {})
        .populate('college', 'collegeName logo address')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Requirement.countDocuments(filter),
    ]);

    if (keyword) {
      await logSearch({ userId: req.user?._id || null, query: keyword, type: 'requirement' });
    }

    return res.status(200).json(
      new ApiResponse(200, requirements, 'Active requirements fetched', {
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
