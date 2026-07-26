import multer from "multer";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error instanceof multer.MulterError) {
    error = new ApiError(400, `File upload error: ${error.message}`);
  }

  // Mongoose CastError happens when an invalid/malformed ObjectId (or empty
  // string, e.g. from an unresolved Postman variable) is passed to a
  // findById/findOne-by-id call. Left unhandled this bubbles up as a raw
  // 500 instead of a clean, expected 400 "not found / invalid id" response.
  if (error instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid ${error.path}: "${error.value}"`);
  }

  // Mongoose schema validation errors (missing required fields, enum
  // mismatches, etc. triggered outside express-validator) should also
  // surface as 400s with the specific field messages, not a generic 500.
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    error = new ApiError(400, "Validation failed", messages);
  }

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error.errors || []);
  }

  if (process.env.NODE_ENV === "development") {
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