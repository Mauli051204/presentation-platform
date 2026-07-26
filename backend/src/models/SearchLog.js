import mongoose from 'mongoose';

const searchLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    query: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: ['presenter', 'requirement', 'college'],
      required: true,
    },
  },
  { timestamps: true }
);

searchLogSchema.index({ query: 1, type: 1 });
searchLogSchema.index({ user: 1, createdAt: -1 });

const SearchLog = mongoose.model('SearchLog', searchLogSchema);
export default SearchLog;
