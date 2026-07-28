import mongoose from 'mongoose';

const skillEndorsementSchema = new mongoose.Schema(
  {
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PresenterProfile',
      required: true,
    },
    skill: { type: String, required: true, trim: true },
    endorsedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endorserRole: { type: String, enum: ['presenter', 'college'], required: true },
  },
  { timestamps: true }
);

// One endorsement per person per skill per presenter — re-clicking toggles it off.
skillEndorsementSchema.index({ presenter: 1, skill: 1, endorsedBy: 1 }, { unique: true });
skillEndorsementSchema.index({ presenter: 1, skill: 1 });

const SkillEndorsement = mongoose.model('SkillEndorsement', skillEndorsementSchema);
export default SkillEndorsement;
