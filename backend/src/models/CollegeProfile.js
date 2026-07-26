import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    headOfDepartment: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const collegeProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeName: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    website: { type: String, trim: true, default: '' },
    contactPerson: {
      name: { type: String, trim: true, default: '' },
      designation: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    address: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    departments: [departmentSchema],
    logo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    gallery: [galleryImageSchema],
    isVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

collegeProfileSchema.index({ 'address.city': 1 });
collegeProfileSchema.index({ collegeName: 'text', description: 'text' });

const CollegeProfile = mongoose.model('CollegeProfile', collegeProfileSchema);
export default CollegeProfile;
