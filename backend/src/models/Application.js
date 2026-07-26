import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
    },
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PresenterProfile',
      required: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeProfile',
      required: true,
    },
    coverNote: { type: String, trim: true, maxlength: 1000, default: '' },
    proposedFee: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ['applied', 'shortlisted','booked', 'rejected', 'withdrawn' ],
      default: 'applied',
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

applicationSchema.index({ requirement: 1, presenter: 1 }, { unique: true });
applicationSchema.index({ presenter: 1, status: 1 });
applicationSchema.index({ college: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
