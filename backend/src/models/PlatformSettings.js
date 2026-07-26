import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'platform_settings', unique: true },
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
export default PlatformSettings;
