import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
    },
    importance: {
      type: Number,
      enum: [1, 2, 3], // 1: Low, 2: Medium, 3: High
      default: 2,
    },
    revisionThresholdDays: {
      type: Number,
      default: 14,
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 3, // Self-rated 1-5
    },
    lastActivityAt: {
      type: Date,
      default: null, // Set only when practice or assessment is recorded
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

topicSchema.index({ subjectId: 1, lastActivityAt: -1 });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;

