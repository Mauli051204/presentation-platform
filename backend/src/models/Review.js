import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    reviewerRole: { type: String, enum: ['presenter', 'college'], required: true },
    reviewerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: { type: String, enum: ['presenter', 'college'], required: true },
    targetProfileModel: {
      type: String,
      required: true,
      enum: ['PresenterProfile', 'CollegeProfile'],
    },
    targetProfile: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetProfileModel',
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ booking: 1, reviewerRole: 1 }, { unique: true });
reviewSchema.index({ targetProfile: 1, targetProfileModel: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
