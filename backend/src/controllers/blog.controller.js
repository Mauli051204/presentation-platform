import BlogPost from '../models/BlogPost.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { slugify } from '../utils/slugify.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';

const uniqueSlug = async (title, excludeId = null) => {
  const base = slugify(title);
  let slug = base;
  let counter = 1;
  // Guard against an infinite loop on pathological input — 50 attempts is
  // far more than any real title collision would ever need.
  for (let i = 0; i < 50; i++) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const existing = await BlogPost.findOne(filter);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
};

// ── Admin ────────────────────────────────────────────────────────────────

export const createBlogPost = async (req, res, next) => {
  try {
    const { title, excerpt, content, category, tags } = req.body;
    const slug = await uniqueSlug(title);

    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      category,
      tags: tags || [],
      author: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, post, 'Blog post created as draft'));
  } catch (error) {
    next(error);
  }
};

export const updateBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return next(new ApiError(404, 'Blog post not found'));

    const allowedFields = ['title', 'excerpt', 'content', 'category', 'tags'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });

    if (req.body.title && req.body.title !== post.title) {
      post.slug = await uniqueSlug(req.body.title, post._id);
    }

    await post.save();

    return res.status(200).json(new ApiResponse(200, post, 'Blog post updated'));
  } catch (error) {
    next(error);
  }
};

export const updateBlogPostStatus = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return next(new ApiError(404, 'Blog post not found'));

    post.status = req.body.status;
    if (post.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
    await post.save();

    return res.status(200).json(new ApiResponse(200, post, `Post marked as ${post.status}`));
  } catch (error) {
    next(error);
  }
};

export const uploadBlogCoverImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, 'No image file provided'));

    const post = await BlogPost.findById(req.params.id);
    if (!post) return next(new ApiError(404, 'Blog post not found'));

    if (post.coverImage?.publicId) {
      await deleteFromCloudinary(post.coverImage.publicId, 'image');
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'presentation-platform/blog/covers',
      resource_type: 'image',
    });

    post.coverImage = { url: result.secure_url, publicId: result.public_id };
    await post.save();

    return res.status(200).json(new ApiResponse(200, post.coverImage, 'Cover image uploaded'));
  } catch (error) {
    next(error);
  }
};

export const deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return next(new ApiError(404, 'Blog post not found'));

    if (post.coverImage?.publicId) {
      await deleteFromCloudinary(post.coverImage.publicId, 'image');
    }
    await post.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, 'Blog post deleted'));
  } catch (error) {
    next(error);
  }
};

export const listBlogPostsAdmin = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BlogPost.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, posts, 'Blog posts fetched', {
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

export const getBlogPostByIdAdmin = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name');
    if (!post) return next(new ApiError(404, 'Blog post not found'));
    return res.status(200).json(new ApiResponse(200, post, 'Blog post fetched'));
  } catch (error) {
    next(error);
  }
};

// ── Public ───────────────────────────────────────────────────────────────

export const listBlogPostsPublic = async (req, res, next) => {
  try {
    const { keyword, category } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 9, 30);
    const skip = (page - 1) * limit;

    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (keyword) filter.$text = { $search: keyword };

    const sort = keyword ? { score: { $meta: 'textScore' } } : { publishedAt: -1 };

    const [posts, total] = await Promise.all([
      BlogPost.find(filter, keyword ? { score: { $meta: 'textScore' } } : {})
        .populate('author', 'name')
        .select('-content')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      BlogPost.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, posts, 'Blog posts fetched', {
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

export const getBlogPostBySlugPublic = async (req, res, next) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('author', 'name');

    if (!post) return next(new ApiError(404, 'Blog post not found'));

    return res.status(200).json(new ApiResponse(200, post, 'Blog post fetched'));
  } catch (error) {
    next(error);
  }
};
