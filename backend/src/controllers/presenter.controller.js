import PresenterProfile from '../models/PresenterProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import { logSearch } from '../services/search.service.js';

const checkCompleteness = (profile) => {
  profile.isProfileComplete = Boolean(
    profile.headline && profile.bio && profile.skills?.length && profile.education?.length
  );
};

export const createOrUpdateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'headline',
      'bio',
      'skills',
      'languages',
      'location',
      'education',
      'experience',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    let profile = await PresenterProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new PresenterProfile({ user: req.user._id, ...updates });
    } else {
      Object.assign(profile, updates);
    }

    checkCompleteness(profile);
    await profile.save();

    return res
      .status(200)
      .json(new ApiResponse(200, profile, 'Presenter profile saved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await PresenterProfile.findOne({ user: req.user._id }).populate(
      'user',
      'name email phone role isEmailVerified'
    );

    if (!profile) {
      return next(new ApiError(404, 'Presenter profile not found. Create one first.'));
    }

    return res.status(200).json(new ApiResponse(200, profile, 'Profile fetched'));
  } catch (error) {
    next(error);
  }
};

export const getPresenterById = async (req, res, next) => {
  try {
    const profile = await PresenterProfile.findById(req.params.id).populate('user', 'name role');

    if (!profile) {
      return next(new ApiError(404, 'Presenter not found'));
    }

    return res.status(200).json(new ApiResponse(200, profile, 'Presenter profile fetched'));
  } catch (error) {
    next(error);
  }
};

export const listPresenters = async (req, res, next) => {
  try {
    const { keyword, skills, languages, city, experienceMin, feeMin, feeMax, availableOn, sortBy } =
      req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const matchStage = { isProfileComplete: true };

    if (keyword) matchStage.$text = { $search: keyword };
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      matchStage.skills = { $in: skillList.map((s) => new RegExp(s, 'i')) };
    }
    if (languages) {
      const langList = languages.split(',').map((l) => l.trim());
      matchStage.languages = { $in: langList.map((l) => new RegExp(l, 'i')) };
    }
    if (city) matchStage['location.city'] = new RegExp(city, 'i');
    if (availableOn) {
      const day = new Date(availableOn);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      matchStage.availability = { $gte: day, $lt: nextDay };
    }
    if (feeMin || feeMax) {
      matchStage.expectedFeeMin = {};
      if (feeMax) matchStage.expectedFeeMin.$lte = Number(feeMax);
      if (feeMin) matchStage.expectedFeeMax = { $gte: Number(feeMin) };
    }

    const sortStage = {};
    if (keyword) sortStage.score = { $meta: 'textScore' };
    if (sortBy === 'rating') sortStage.ratingsAverage = -1;
    if (sortBy === 'experience') sortStage.experienceYears = -1;
    if (Object.keys(sortStage).length === 0) sortStage.createdAt = -1;

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          experienceYears: {
            $reduce: {
              input: '$experience',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $ifNull: ['$$this.endDate', new Date()] },
                          '$$this.startDate',
                        ],
                      },
                      31536000000,
                    ],
                  },
                ],
              },
            },
          },
          ...(keyword ? { score: { $meta: 'textScore' } } : {}),
        },
      },
    ];

    if (experienceMin) {
      pipeline.push({ $match: { experienceYears: { $gte: Number(experienceMin) } } });
    }

    pipeline.push(
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
                pipeline: [{ $project: { name: 1 } }],
              },
            },
            { $unwind: '$user' },
          ],
          totalCount: [{ $count: 'count' }],
        },
      }
    );

    const [result] = await PresenterProfile.aggregate(pipeline);
    const presenters = result.data;
    const total = result.totalCount[0]?.count || 0;

    if (keyword) {
      await logSearch({ userId: req.user?._id || null, query: keyword, type: 'presenter' });
    }

    return res.status(200).json(
      new ApiResponse(200, presenters, 'Presenters fetched', {
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

export const updateAvailability = async (req, res, next) => {
  try {
    const { dates } = req.body;
    const profile = await PresenterProfile.findOne({ user: req.user._id });

    if (!profile) {
      return next(new ApiError(404, 'Presenter profile not found. Create one first.'));
    }

    profile.availability = [...new Set(dates.map((d) => new Date(d).toISOString()))].map(
      (d) => new Date(d)
    );
    await profile.save();

    return res.status(200).json(new ApiResponse(200, profile.availability, 'Availability updated'));
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, 'No image file provided'));

    const profile = await PresenterProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'Presenter profile not found. Create one first.'));

    if (profile.profileImage?.publicId) {
      await deleteFromCloudinary(profile.profileImage.publicId, 'image');
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'presentation-platform/presenters/profile-images',
      resource_type: 'image',
    });

    profile.profileImage = { url: result.secure_url, publicId: result.public_id };
    await profile.save();

    return res
      .status(200)
      .json(new ApiResponse(200, profile.profileImage, 'Profile image uploaded'));
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, 'No resume file provided'));

    const profile = await PresenterProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'Presenter profile not found. Create one first.'));

    if (profile.resume?.publicId) {
      await deleteFromCloudinary(profile.resume.publicId, 'raw');
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'presentation-platform/presenters/resumes',
      resource_type: 'raw',
    });

    profile.resume = {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
    };
    await profile.save();

    return res
      .status(200)
      .json(new ApiResponse(200, profile.resume, 'Resume uploaded successfully'));
  } catch (error) {
    next(error);
  }
};

const addMediaAsset = (arrayField, resourceType) => async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, 'No file provided'));
    const { title } = req.body;

    const profile = await PresenterProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'Presenter profile not found. Create one first.'));

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: `presentation-platform/presenters/${arrayField}`,
      resource_type: resourceType,
    });

    profile[arrayField].push({ title, url: result.secure_url, publicId: result.public_id });
    await profile.save();

    return res
      .status(201)
      .json(new ApiResponse(201, profile[arrayField], `${arrayField} uploaded successfully`));
  } catch (error) {
    next(error);
  }
};

export const uploadCertificate = addMediaAsset('certificates', 'image');
export const uploadVideo = addMediaAsset('videos', 'video');
export const uploadSlide = addMediaAsset('presentationSlides', 'raw');

const removeMediaAsset = (arrayField, resourceType) => async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const profile = await PresenterProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'Presenter profile not found'));

    const asset = profile[arrayField].id(assetId);
    if (!asset) return next(new ApiError(404, 'Asset not found'));

    await deleteFromCloudinary(asset.publicId, resourceType);
    profile[arrayField].pull({ _id: assetId });
    await profile.save();

    return res.status(200).json(new ApiResponse(200, profile[arrayField], 'Asset removed'));
  } catch (error) {
    next(error);
  }
};

export const removeCertificate = removeMediaAsset('certificates', 'image');
export const removeVideo = removeMediaAsset('videos', 'video');
export const removeSlide = removeMediaAsset('presentationSlides', 'raw');
