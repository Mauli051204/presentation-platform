import PlatformSettings from '../models/PlatformSettings.js';
import { env } from '../config/env.js';

export const getCommissionPercent = async () => {
  let settings = await PlatformSettings.findOne({ singletonKey: 'platform_settings' });
  if (!settings) {
    settings = await PlatformSettings.create({
      singletonKey: 'platform_settings',
      commissionPercent: env.razorpay.commissionPercent,
    });
  }
  return settings.commissionPercent;
};

export const setCommissionPercent = async (percent) => {
  const settings = await PlatformSettings.findOneAndUpdate(
    { singletonKey: 'platform_settings' },
    { commissionPercent: percent },
    { upsert: true, new: true }
  );
  return settings.commissionPercent;
};
