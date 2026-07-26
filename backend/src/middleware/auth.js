import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

export const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return next(new ApiError(401, 'Access token missing'));
    }

    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'User not found or inactive'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }
};

export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
