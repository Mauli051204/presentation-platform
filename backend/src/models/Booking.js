import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
    },
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
    presentationType: { type: String, enum: ['online', 'offline'], required: true },
    meetingLink: { type: String, trim: true, default: null },
    scheduledDate: { type: Date, required: true },
    agreedFee: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    totalChargeAmount: { type: Number, required: true }, // agreedFee + commissionAmount — what the college actually pays
    presenterPayoutAmount: { type: Number, required: true }, // = agreedFee in full, presenter is never deducted
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'completed', 'cancelled'],
      default: 'pending_payment',
    },
    collegeConfirmedCompletion: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ presenter: 1, status: 1 });
bookingSchema.index({ college: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
