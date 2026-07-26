import crypto from 'crypto';

export const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

export const generateRawToken = () => crypto.randomBytes(32).toString('hex');
