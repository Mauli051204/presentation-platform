import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error instanceof multer.MulterError) {
    error = new ApiError(400, `File upload error: ${error.message}`);
  }

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || []);
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    data: null,
    timestamp: error.timestamp,
  });
};
