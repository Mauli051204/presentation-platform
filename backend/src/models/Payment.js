import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    commissionAmount: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    paidAt: { type: Date, default: null },
    payoutReleased: { type: Boolean, default: false },
    payoutReleasedAt: { type: Date, default: null },
    refundId: { type: String, default: null },
    refundAmount: { type: Number, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
