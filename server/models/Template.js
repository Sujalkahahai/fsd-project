import mongoose from 'mongoose';

const templateResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, default: '' },
    type: { type: String, default: 'article' },
  },
  { _id: false }
);

const templateTopicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    importance: { type: Number, default: 2 },
    revisionThresholdDays: { type: Number, default: 14 },
    resources: [templateResourceSchema],
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    topics: [templateTopicSchema],
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

const Template = mongoose.model('Template', templateSchema);

export default Template;

