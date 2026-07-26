import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};
