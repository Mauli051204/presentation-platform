import CollegeProfile from '../models/CollegeProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import { logSearch } from '../services/search.service.js';

const checkCompleteness = (profile) => {
  profile.isProfileComplete = Boolean(
    profile.collegeName &&
    profile.description &&
    profile.address?.city &&
    profile.contactPerson?.name &&
    profile.logo?.url
  );
};

export const createOrUpdateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['collegeName', 'description', 'website', 'contactPerson', 'address'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    let profile = await CollegeProfile.findOne({ user: req.user._id });

    if (!profile) {
      if (!updates.collegeName) {
        return next(new ApiError(400, 'collegeName is required to create a college profile'));
      }
      profile = new CollegeProfile({ user: req.user._id, ...updates });
    } else {
      Object.assign(profile, updates);
    }

    checkCompleteness(profile);
    await profile.save();

    return res
      .status(200)
      .json(new ApiResponse(200, profile, 'College profile saved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await CollegeProfile.findOne({ user: req.user._id }).populate(
      'user',
      'name email phone role isEmailVerified'
    );

    if (!profile) {
      return next(new ApiError(404, 'College profile not found. Create one first.'));
    }

    return res.status(200).json(new ApiResponse(200, profile, 'Profile fetched'));
  } catch (error) {
    next(error);
  }
};

export const getCollegeById = async (req, res, next) => {
  try {
    const profile = await CollegeProfile.findById(req.params.id).populate('user', 'name role');
    if (!profile) return next(new ApiError(404, 'College not found'));
    return res.status(200).json(new ApiResponse(200, profile, 'College profile fetched'));
  } catch (error) {
    next(error);
  }
};

export const listColleges = async (req, res, next) => {
  try {
    const { keyword, city, department, sortBy } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { isProfileComplete: true };
    if (keyword) filter.$text = { $search: keyword };
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (department) filter['departments.name'] = new RegExp(department, 'i');

    let sort = { createdAt: -1 };
    if (sortBy === 'rating') sort = { ratingsAverage: -1 };
    if (keyword) sort = { score: { $meta: 'textScore' } };

    const [colleges, total] = await Promise.all([
      CollegeProfile.find(filter, keyword ? { score: { $meta: 'textScore' } } : {})
        .populate('user', 'name')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      CollegeProfile.countDocuments(filter),
    ]);

    if (keyword) {
      await logSearch({ userId: req.user?._id || null, query: keyword, type: 'college' });
    }

    return res.status(200).json(
      new ApiResponse(200, colleges, 'Colleges fetched', {
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

export const updateDepartments = async (req, res, next) => {
  try {
    const { departments } = req.body;
    const profile = await CollegeProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'College profile not found. Create one first.'));

    profile.departments = departments;
    await profile.save();

    return res.status(200).json(new ApiResponse(200, profile.departments, 'Departments updated'));
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, 'No logo file provided'));

    const profile = await CollegeProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'College profile not found. Create one first.'));

    if (profile.logo?.publicId) {
      await deleteFromCloudinary(profile.logo.publicId, 'image');
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'presentation-platform/colleges/logos',
      resource_type: 'image',
    });

    profile.logo = { url: result.secure_url, publicId: result.public_id };
    checkCompleteness(profile);
    await profile.save();

    return res.status(200).json(new ApiResponse(200, profile.logo, 'Logo uploaded successfully'));
  } catch (error) {
    next(error);
  }
};

export const uploadGalleryImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, 'No image file provided'));
    const { caption } = req.body;

    const profile = await CollegeProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'College profile not found. Create one first.'));

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'presentation-platform/colleges/gallery',
      resource_type: 'image',
    });

    profile.gallery.push({
      url: result.secure_url,
      publicId: result.public_id,
      caption: caption || '',
    });
    await profile.save();

    return res.status(201).json(new ApiResponse(201, profile.gallery, 'Gallery image uploaded'));
  } catch (error) {
    next(error);
  }
};

export const removeGalleryImage = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const profile = await CollegeProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ApiError(404, 'College profile not found'));

    const asset = profile.gallery.id(assetId);
    if (!asset) return next(new ApiError(404, 'Gallery image not found'));

    await deleteFromCloudinary(asset.publicId, 'image');
    profile.gallery.pull({ _id: assetId });
    await profile.save();

    return res.status(200).json(new ApiResponse(200, profile.gallery, 'Gallery image removed'));
  } catch (error) {
    next(error);
  }
};
