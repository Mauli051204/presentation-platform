import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeProfile',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    department: { type: String, trim: true, default: '' },
    presentationType: {
      type: String,
      enum: ['online', 'offline'],
      required: true,
    },
    requiredSkills: [{ type: String, trim: true }],
    requiredLanguages: [{ type: String, trim: true }],
    budgetMin: { type: Number, required: true, min: 0 },
    budgetMax: { type: Number, required: true, min: 0 },
    numberOfPresentersNeeded: { type: Number, default: 1, min: 1 },
    eventDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    applicationDeadline: { type: Date, required: true },
    location: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      venue: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'cancelled'],
      default: 'draft',
    },
    applicationsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

requirementSchema.pre('validate', function checkBudgetRange(next) {
  if (this.budgetMax < this.budgetMin) {
    return next(new Error('budgetMax cannot be less than budgetMin'));
  }
  next();
});

requirementSchema.index({ status: 1, eventDate: 1 });
requirementSchema.index({ requiredSkills: 1 });
requirementSchema.index({ 'location.city': 1 });
requirementSchema.index({ title: 'text', description: 'text' });

const Requirement = mongoose.model('Requirement', requirementSchema);
export default Requirement;
