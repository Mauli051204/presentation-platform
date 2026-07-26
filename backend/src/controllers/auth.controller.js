import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { hashToken, generateRawToken } from '../utils/hash.js';
import {
  generateAccessToken,
  issueRefreshToken,
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
} from '../services/token.service.js';
import { sendEmail } from '../utils/sendEmail.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const cookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  expires: expiresAt,
  path: '/',
});

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

const safeSendEmail = (payload) => {
  // Deliberately not awaited by callers — email delivery should never make
  // the user wait for the register/login response. Fire it and let it
  // resolve in the background; failures are just logged.
  sendEmail(payload).catch((error) => {
    console.error(`[email] Failed to send email to ${payload.to}: ${error.message}`);
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ApiError(409, 'An account with this email already exists'));
    }

    const user = await User.create({ name, email, password, role, phone });

    const rawToken = generateRawToken();
    user.emailVerificationTokenHash = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    await user.save();

    const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
    safeSendEmail({
      to: user.email,
      subject: 'Verify your Presentation Platform account',
      html: `<p>Hi ${user.name},</p><p>Click below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          user.toSafeObject(),
          'Registration successful. Please verify your email.'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'This account has been deactivated'));
    }

    const accessToken = generateAccessToken(user);
    const { rawToken, expiresAt } = await issueRefreshToken(user, req.ip);

    res.cookie(REFRESH_COOKIE_NAME, rawToken, cookieOptions(expiresAt));

    return res
      .status(200)
      .json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!incomingToken) {
      return next(new ApiError(401, 'Refresh token missing'));
    }

    const result = await verifyAndRotateRefreshToken(incomingToken, req.ip);
    if (!result) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }

    const { user, rawToken, expiresAt } = result;
    const accessToken = generateAccessToken(user);

    res.cookie(REFRESH_COOKIE_NAME, rawToken, cookieOptions(expiresAt));

    return res
      .status(200)
      .json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, 'Token refreshed'));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (incomingToken) {
      await revokeRefreshToken(incomingToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user.toSafeObject(), 'Current user fetched'));
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return next(new ApiError(400, 'Verification token is required'));

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationTokenHash +emailVerificationExpires');

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired verification link'));
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.status(200).json(new ApiResponse(200, null, 'Email verified successfully'));
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.isEmailVerified) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            'If this account exists and is unverified, an email has been sent'
          )
        );
    }

    const rawToken = generateRawToken();
    user.emailVerificationTokenHash = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    await user.save();

    const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
    safeSendEmail({
      to: user.email,
      subject: 'Verify your Presentation Platform account',
      html: `<p>Click below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'If this account exists and is unverified, an email has been sent'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'If this account exists, a reset link has been sent'));
    }

    const rawToken = generateRawToken();
    user.passwordResetTokenHash = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
    safeSendEmail({
      to: user.email,
      subject: 'Reset your Presentation Platform password',
      html: `<p>Click below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes.</p>`,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If this account exists, a reset link has been sent'));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired reset link'));
    }

    user.password = password;
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Password reset successful. Please log in.'));
  } catch (error) {
    next(error);
  }
};
