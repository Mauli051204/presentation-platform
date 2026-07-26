import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    yearOfCompletion: { type: Number, required: true },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: true }
);

const mediaAssetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const presenterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: { type: String, trim: true, maxlength: 150, default: '' },
    bio: { type: String, trim: true, maxlength: 2000, default: '' },
    skills: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    location: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
    },
    education: [educationSchema],
    experience: [experienceSchema],
    availability: [{ type: Date }],
    expectedFeeMin: { type: Number, default: null, min: 0 },
    expectedFeeMax: { type: Number, default: null, min: 0 },
    profileImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    resume: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    certificates: [mediaAssetSchema],
    videos: [mediaAssetSchema],
    presentationSlides: [mediaAssetSchema],
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

presenterProfileSchema.index({ skills: 1 });
presenterProfileSchema.index({ 'location.city': 1 });
presenterProfileSchema.index({ headline: 'text', bio: 'text', skills: 'text' });

const PresenterProfile = mongoose.model('PresenterProfile', presenterProfileSchema);
export default PresenterProfile;
