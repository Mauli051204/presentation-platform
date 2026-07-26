import jwt from 'jsonwebtoken';
import ms from 'ms';
import { env } from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashToken, generateRawToken } from '../utils/hash.js';

export const generateAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });

export const issueRefreshToken = async (user, ip = null) => {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ms(env.jwt.refreshExpires));

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    createdByIp: ip,
  });

  return { rawToken, expiresAt };
};

export const verifyAndRotateRefreshToken = async (rawToken, ip = null) => {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash, revoked: false }).populate('user');

  if (!existing || existing.expiresAt < new Date()) {
    if (existing) {
      existing.revoked = true;
      await existing.save();
    }
    return null;
  }

  existing.revoked = true;
  await existing.save();

  const { rawToken: newRawToken, expiresAt } = await issueRefreshToken(existing.user, ip);

  return { user: existing.user, rawToken: newRawToken, expiresAt };
};

export const revokeRefreshToken = async (rawToken) => {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
};
